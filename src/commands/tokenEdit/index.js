const { editCheck } = require('./editCheck');
const { editRoleAmount } = require('./editRoleAmount');
const { editRoleName } = require('./editRoleName');
const { handleRoleAmountEdit } = require('./handleRoleAmountEdit');
const { handleRoleNameEdit } = require('./handleRoleNameEdit');

const { rolesGet } = require("../../db");

module.exports = {
  starryCommandTokenEdit: {
    adminOnly: true,
    name: 'edit',
    description: "(Admin only) Edit a token rule's name or amount",
    config: async (req, res, ctx, next) => {
      const { interaction } = req;
      let roles = await rolesGet(interaction.guildId);
      if (roles.length === 0) {
        return {
          content: 'No roles exist to edit!',
        }
      } else {
        const title = `Current token rules`;
        const description = `${roles.map(role => {
          const roleName = role.give_role;
          const roleAmt = role.has_minimum_of;
          const roleDecimals = role.decimals;
          return `★ ${roleName} (min: ${(roleAmt / (10 ** roleDecimals)) })\n`;
        }).join('')}`;
        const footer = 'Please type a token rule to edit';

        return {
          embeds: [{ title, description, footer }],
          ephemeral: true,
          next: 'editCheck',
        }
      }
    },
    steps: [
      editCheck,
      editRoleAmount,
      editRoleName,
      handleRoleAmountEdit,
      handleRoleNameEdit,
    ]
  }
}