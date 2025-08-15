import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmisbomoyjjnkcjfvbbn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtaXNib21veWpqbmtjamZ2YmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTc4MjcsImV4cCI6MjA3MDQzMzgyN30.Ov7qqfKglOs2fhzMs1rD7iILFlj1UjsNuqE3bUv2GO4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);