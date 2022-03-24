const { buildBasicMessageCommand } = require('../../utils/commands');
const { roleGet } = require("../../db");

module.exports = {
  editCheck: {
    name: 'editCheck',
    execute: buildBasicMessageCommand(async (req, res, ctx, next) => {
      const { interaction } = req;
      const { guildId } = interaction;
      const selectedRole = interaction.content;

      // Make sure we recognize the selected role
      const role = await roleGet(guildId, selectedRole);
      if (!role) {
        await res.error('Invalid role. Remember: first you copy, then you paste.');
        return;
      } else {
        // Save the selection in ctx for later steps
        ctx.selectedRoleName = selectedRole;
        ctx.selectedRole = role;
        return {
          content: `What would you like to edit for ${selectedRole}?`,
          buttons: [
            {
              customId: 'editRoleName',
              label: 'Role Name',
              style: 'PRIMARY',
            },
            {
              customId: 'editRoleAmount',
              label: 'Role Amount',
              style: 'PRIMARY',
            }
          ]
        }
      }
    })
  }
}
