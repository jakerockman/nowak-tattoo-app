// knexfile.js
module.exports = {
  client: 'pg',
  connection: {
    host: 'YOUR_SUPABASE_HOST',
    user: 'YOUR_SUPABASE_USER',
    password: 'YOUR_SUPABASE_PASSWORD',
    database: 'YOUR_SUPABASE_DB',
    port: 5432,
    ssl: { rejectUnauthorized: false }
  },
  migrations: {
    directory: './migrations'
  }
};
