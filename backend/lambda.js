const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME || "ific-profiles";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,Authorization-Token",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT"
};

exports.handler = async (event) => {
  // Handle preflight OPTIONS requests
  if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  try {
    const path = event.rawPath || event.path;
    const method = event.requestContext?.http?.method || event.httpMethod;
    
    // Retrieve user email from Cognito Authorizer if available
    let userEmail = null;
    if (event.requestContext?.authorizer?.jwt?.claims?.email) {
      userEmail = event.requestContext.authorizer.jwt.claims.email;
    } else if (event.requestContext?.authorizer?.claims?.email) {
      userEmail = event.requestContext.authorizer.claims.email;
    }

    // ─── ROUTE: GET /emergency/{id} (PUBLIC) ───
    if (method === "GET" && path.startsWith("/emergency/")) {
      const emergencyId = path.split("/")[2];
      if (!emergencyId) {
        return response(400, { error: "Missing emergency ID" });
      }

      const profileRes = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: `PROFILE#${emergencyId.toUpperCase()}` }
      }));

      const profile = profileRes.Item;
      if (!profile) {
        return response(404, { error: "Profile not found" });
      }

      // Filter out fields marked 'private' (Privacy Engine)
      const sanitizedProfile = {
        name: profile.name,
        emergencyId: profile.emergencyId,
        active: profile.active,
        visibility: profile.visibility || {},
        primaryContactName: profile.primaryContactName,
        primaryContactPhone: profile.primaryContactPhone,
        secondaryContactName: profile.secondaryContactName,
        secondaryContactPhone: profile.secondaryContactPhone
      };

      const fieldsToCheck = ["bloodGroup", "allergies", "conditions", "medication", "instructions", "age"];
      fieldsToCheck.forEach(field => {
        if (profile.visibility?.[field] !== "private") {
          sanitizedProfile[field] = profile[field];
        }
      });

      return response(200, sanitizedProfile);
    }

    // ─── SECURE ROUTES (Require Auth/userEmail) ───
    if (!userEmail) {
      return response(401, { error: "Unauthorized. Missing Cognito credentials." });
    }

    // ─── ROUTE: GET /profile/me ───
    if (method === "GET" && path === "/profile/me") {
      // Find the mapping from User ID to Emergency ID
      const userMapping = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: `USER#${userEmail.toLowerCase()}` }
      }));

      if (!userMapping.Item) {
        return response(404, { error: "No profile matches this user" });
      }

      const profileRes = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: `PROFILE#${userMapping.Item.emergencyId}` }
      }));

      return response(200, profileRes.Item || {});
    }

    // ─── ROUTE: POST/PUT /profile ───
    if ((method === "POST" || method === "PUT") && path === "/profile") {
      const body = JSON.parse(event.body || "{}");
      if (!body.name) {
        return response(400, { error: "Name is required" });
      }

      const emergencyId = (body.emergencyId || generateId()).toUpperCase();

      const newProfile = {
        id: `PROFILE#${emergencyId}`,
        emergencyId,
        userId: userEmail.toLowerCase(),
        name: body.name,
        age: body.age || "",
        bloodGroup: body.bloodGroup || "",
        allergies: body.allergies || "",
        conditions: body.conditions || "",
        medication: body.medication || "",
        instructions: body.instructions || "",
        primaryContactName: body.primaryContactName || "",
        primaryContactPhone: body.primaryContactPhone || "",
        secondaryContactName: body.secondaryContactName || "",
        secondaryContactPhone: body.secondaryContactPhone || "",
        visibility: body.visibility || {},
        active: true,
        updatedAt: new Date().toISOString()
      };

      // Create mapping entry
      const newMapping = {
        id: `USER#${userEmail.toLowerCase()}`,
        emergencyId: emergencyId
      };

      // Store both in DynamoDB
      await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: newProfile }));
      await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: newMapping }));

      return response(200, newProfile);
    }

    return response(404, { error: `Route not found: ${method} ${path}` });

  } catch (error) {
    console.error(error);
    return response(500, { error: "Internal Server Error", details: error.message });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
}

function generateId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}