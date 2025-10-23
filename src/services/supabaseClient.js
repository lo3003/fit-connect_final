import { createClient } from '@supabase/supabase-js'

// Remplace les valeurs ci-dessous par les tiennes.
// Tu les trouveras dans les paramètres de ton projet Supabase > API.
const supabaseUrl = 'https://pzugyhdafteoqyaafbwk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dWd5aGRhZnRlb3F5YWFmYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNDQzMDksImV4cCI6MjA3NTcyMDMwOX0.ry_MbjueW5rJSpkO_IhUcQ77Gl5X1VWubJnr_dFhHdk';

// Crée et exporte le client Supabase.
export const supabase = createClient(supabaseUrl, supabaseKey);
