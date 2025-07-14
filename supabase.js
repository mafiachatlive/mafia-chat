// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://ltrbnjqvmtaposcbfzem.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0cmJuanF2bXRhcG9zY2JmemVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTg2NjksImV4cCI6MjA2Nzk5NDY2OX0.WVKje-Zecelx8FN7JrZSaSriOkUeVvX90QQ-O9pJCpc'

export const supabase = createClient(supabaseUrl, supabaseKey)
