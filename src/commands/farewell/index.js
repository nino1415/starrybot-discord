const { farewellConfirmation } = require('../farewell/farewellConfirmation');
const { farewellRejection } = require('./farewellRejection');

module.exports = {
	starryCommandFarewell: {
		adminOnly: true,
		name: 'farewell',
		description: '(Admin only) Kick starrybot itself from your guild',
		config: {
			message: 'This will delete roles created by starrybot.',
			buttons: [
				{
					next: 'farewellConfirmation',
					label: 'I understand',
					style: 'PRIMARY',
				},
				{
					next: 'farewellRejection',
					label: 'Cancel',
					style: 'SECONDARY',
				}
			],
		},
		steps: [
			farewellConfirmation,
			farewellRejection,
		]
	}
}
