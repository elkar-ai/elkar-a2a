import { supabase } from "../contexts/SupabaseContext";

export async function getAccessToken() {
  const auth_session = await supabase.auth.getSession();
  const session = auth_session.data.session;
  if (session == null) {
    throw new Error("No session found");
  }

  return session.access_token;
}
