// Example migration: add status column to bookings table
exports.up = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    table.string('status', 20).nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('bookings', function(table) {
    table.dropColumn('status');
  });
};
