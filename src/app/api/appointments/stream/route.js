import { connectDB } from "@/db";
import Appointment from "@/models/Appointment";

export async function GET(request) {
  await connectDB();

  const encoder = new TextEncoder();
  let changeStream = null;
  let heartbeat = null;
  let changeTimeout = null;
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const sendData = (type, data) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
          );
        } catch (e) {
          isClosed = true;
          console.error("Stream enqueue error, client connection might be closed:", e);
        }
      };

      try {
        const initial = await Appointment.find({}).sort({ date: 1 });
        sendData("initial", initial);

        changeStream = Appointment.watch();

        changeStream.on("change", () => {
          if (changeTimeout) clearTimeout(changeTimeout);

          changeTimeout = setTimeout(async () => {
            try {
              const appointments = await Appointment.find({}).sort({ date: 1 });
              sendData("update", appointments);
            } catch (err) {
              console.error("Error fetching updated data during stream change broadcast:", err);
            }
          }, 100);
        });

        changeStream.on("error", (err) => {
          console.error("Change stream execution error:", err);
          isClosed = true;
          try { controller.close(); } catch (e) { }
        });

        heartbeat = setInterval(() => {
          if (isClosed) {
            clearInterval(heartbeat);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch (e) {
            isClosed = true;
            clearInterval(heartbeat);
          }
        }, 15000);

      } catch (error) {
        console.error("Failed to initialize SSE stream:", error);
        controller.error(error);
      }
    },
    cancel() {
      isClosed = true;
      if (heartbeat) clearInterval(heartbeat);
      if (changeTimeout) clearTimeout(changeTimeout);
      if (changeStream) changeStream.close();
      console.log("Active SSE stream canceled: Client disconnected.");
    }
  });

  request.signal.addEventListener("abort", () => {
    isClosed = true;
    if (heartbeat) clearInterval(heartbeat);
    if (changeTimeout) clearTimeout(changeTimeout);
    if (changeStream) changeStream.close();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform, private",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ==========================================
// POST HANDLER FOR SAVING APPOINTMENTS
// ==========================================
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const newAppointment = new Appointment(body);
    await newAppointment.save();

    return new Response(JSON.stringify({ success: true, data: newAppointment }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to save appointment in database:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ==========================================
// PUT HANDLER FOR UPDATING APPOINTMENTS (status + full edit)
// ==========================================
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, status, ...rest } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Missing required field: id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Kung status lang — status update lang
    // Kung may ibang fields — full update
    const updateData = status && Object.keys(rest).length === 0
      ? { status }
      : { ...rest, ...(status && { status }) };

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after' }
    );

    if (!updatedAppointment) {
      return new Response(JSON.stringify({ success: false, error: "Appointment record not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: updatedAppointment }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to update appointment in database:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ==========================================
// DELETE HANDLER FOR REMOVING APPOINTMENTS
// ==========================================
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Missing required query parameter: id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deletedAppointment = await Appointment.findByIdAndDelete(id);

    if (!deletedAppointment) {
      return new Response(JSON.stringify({ success: false, error: "Appointment record not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Appointment deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to delete appointment from database:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}