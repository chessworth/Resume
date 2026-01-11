
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Use Service Role to allow admin-like actions if needed
);

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { action, payload } = JSON.parse(event.body || "{}");

    switch (action) {
      case "LOGIN": {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password,
        });

        if (error) throw error;
        if (!data.user) throw new Error("User not found");

        return {
          statusCode: 200,
          body: JSON.stringify({
            id: data.user.id,
            name: data.user.user_metadata.full_name || 'User',
            email: data.user.email,
            phone: data.user.user_metadata.phone,
            icon: data.user.user_metadata.icon || 'fa-user'
          })
        };
      }

      case "SIGN_UP": {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            data: {
              full_name: payload.name,
              phone: payload.phone,
              icon: payload.icon,
            }
          }
        });

        if (error) throw error;
        if (!data.user) throw new Error("Sign up failed");

        return {
          statusCode: 200,
          body: JSON.stringify({
            id: data.user.id,
            name: data.user.user_metadata.full_name,
            email: data.user.email,
            phone: data.user.user_metadata.phone,
            icon: data.user.user_metadata.icon
          })
        };
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid action" }) };
    }
  } catch (error: any) {
    console.error("Auth Proxy Error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: error.message || "Authentication error" })
    };
  }
};
