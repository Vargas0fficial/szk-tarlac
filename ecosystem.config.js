module.exports = {
    apps: [
        {
            name: "pang",
            script: "node",
            args: "node_modules/next/dist/bin/next start -p 3000",
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "launion",
            script: "node",
            args: "node_modules/next/dist/bin/next start -p 3001",
            env: {
                NODE_ENV: "production",
            }
        },
        {
            name: "tarlac",
            script: "node",
            args: "node_modules/next/dist/bin/next start -p 3002",
            env: {
                NODE_ENV: "production",
            }
        },
    ],
};