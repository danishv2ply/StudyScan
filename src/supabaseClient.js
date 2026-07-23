import { createClient } from "@supabase/supabase-js";

// Make sure there is NO "/rest/v1/" at the end of this string!
const supabaseUrl = "https://kbainymwlnifwzcjewqa.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYWlueW13bG5pZnd6Y2pld3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MDQ1MDAsImV4cCI6MjA5ODk4MDUwMH0.QLm1G8lF7H2-BGpgnzsbbQFCfF5bDRPDn5pHok-AUJY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);