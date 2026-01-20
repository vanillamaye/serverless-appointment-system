import mysql from 'mysql2/promise';
import { 
    DynamoDBClient, 
    PutItemCommand, 
    QueryCommand 
} from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({ region: process.env.REGION || "ap-southeast-1" });

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;
    const pathParams = event.pathParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    if (method === 'OPTIONS') return corsResponse();

    let conn;
    try {
        // --- ROUTE: GET /services (MySQL) ---
        if (method === "GET" && path === "/services") {
            conn = await getMySQLConn();
            const [rows] = await conn.execute("SELECT * FROM services ORDER BY created_at DESC");
            return json(rows);
        }

        // --- ROUTE: GET /service/{service_id} (MySQL) ---
        if (method === "GET" && path.startsWith("/service/")) {
            const serviceId = pathParams.service_id;
            conn = await getMySQLConn();
            const [rows] = await conn.execute("SELECT * FROM services WHERE service_id = ?", [serviceId]);
            return rows.length > 0 ? json(rows[0]) : json({ message: "Service not found" }, 404);
        }

        // --- ROUTE: POST /appointment (MySQL + DynamoDB) ---
        if (method === "POST" && path === "/appointment") {
            const { appointment_id, client_id, service_id, appointment_date, appointment_time, full_name, email } = body;
            
            conn = await getMySQLConn();
            // MySQL Save
            await conn.execute(
                `INSERT INTO appointments (appointment_id, client_id, service_id, appointment_date, appointment_time, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
                [appointment_id, client_id, service_id, appointment_date, appointment_time]
            );

            // DynamoDB Save 
            await dynamo.send(new PutItemCommand({
                TableName: "services-appntment-client",
                Item: {
                    pk: { S: `APPOINTMENT#${appointment_id}` },
                    sk: { S: `CLIENT#${client_id}` },
                    full_name: { S: full_name || 'N/A' },
                    email: { S: email || 'N/A' }
                }
            }));
            return json({ message: "Appointment saved in both databases!" }, 201);
        }

        // --- ROUTE: GET /clients/{event_id} (DynamoDB) ---
        if (method === "GET" && path.startsWith("/clients/")) {
            const appointmentId = pathParams.event_id; 
            const result = await dynamo.send(new QueryCommand({
                TableName: "services-appntment-client",
                KeyConditionExpression: "pk = :pk",
                ExpressionAttributeValues: { ":pk": { S: `APPOINTMENT#${appointmentId}` } }
            }));
            return json(result.Items ? result.Items.map(i => ({ name: i.full_name?.S, email: i.email?.S })) : []);
        }

        return json({ message: "Route not found" }, 404);

    } catch (err) {
        console.error(err);
        return json({ error: err.message }, 500);
    } finally {
        if (conn) await conn.end();
    }
};

// --- HELPER FUNCTIONS (KEEP THESE) ---
async function getMySQLConn() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
}

function json(data, statusCode = 200) {
    return { statusCode, headers: corsHeaders(), body: JSON.stringify(data) };
}

function corsResponse() {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
}

function corsHeaders() {
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With",
        "Access-Control-Allow-Credentials": true
    };
}