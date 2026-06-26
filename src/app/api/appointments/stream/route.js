import { connectDB } from "@/db";
import Appointment from "@/models/Appointment";

export async function GET(request) {
  await connectDB();

  const encoder = new TextEncoder();
  let changeStream = null;
  let heartbeat = null;
  let changeTimeout = null;
  let isClosed = false; // Flag to prevent enqueue after stream is closed

  const stream = new ReadableStream({
    async start(controller) {
      const sendData = (type, data) => {
        if (isClosed) return; // Stop if already closed
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
        // 1. Initial data fetch upon connection
        const initial = await Appointment.find({}).sort({ date: 1 });
        sendData("initial", initial);

        // 2. Initialize Mongoose change stream (MongoDB Atlas Change Stream)
        changeStream = Appointment.watch();

        // Defensive debounce wrapper to manage rapid status switches safely
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

        // 3. Keep-alive heartbeat interval to prevent browser timeout (15 seconds)
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
    // Triggers when the browser closes the connection or navigates away
    cancel() {
      isClosed = true; // Mark as closed
      if (heartbeat) clearInterval(heartbeat);
      if (changeTimeout) clearTimeout(changeTimeout);
      if (changeStream) changeStream.close();
      console.log("Active SSE stream canceled: Client disconnected.");
    }
  });

  // Fallback abort signal listener for request handling optimization
  request.signal.addEventListener("abort", () => {
    isClosed = true; // Mark as closed
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
// PUT HANDLER FOR UPDATING APPOINTMENT STATUS
// ==========================================
export async function PUT(request) {
  try {
    await connectDB();
    const { id, status } = await request.json();

    if (!id || !status) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields: id or status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
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
    console.error("Failed to update appointment status in database:", error);
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