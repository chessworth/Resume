
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { action, payload } = JSON.parse(event.body || "{}");

    switch (action) {
      case "SIGN_UP": {
        const userId = crypto.randomUUID();
        const { error } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            icon: payload.icon,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        return {
          statusCode: 201,
          body: JSON.stringify({ id: userId, ...payload })
        };
      }

      case "LOGIN": {
        // Simple mock login based on email
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', payload.email)
          .single();

        if (error || !data) {
            // If user doesn't exist in this simulation, we'd throw or return 404
            // For this sandbox, let's create a temporary one if email matches "test"
            if (payload.email === 'test@example.com') {
                return { statusCode: 200, body: JSON.stringify({ id: 'mock-id', name: 'Test User', icon: 'fa-user-ninja' })};
            }
            throw new Error("User not found");
        }

        return {
          statusCode: 200,
          body: JSON.stringify(data)
        };
      }

      default:
        return { statusCode: 400, body: "Invalid action" };
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
