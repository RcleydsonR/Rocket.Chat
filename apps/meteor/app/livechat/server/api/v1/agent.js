import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { findRoom, findGuest, findAgent, findOpenRoom } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/agent.info/:rid/:token', {
	async get() {
		check(this.urlParams, {
			rid: String,
			token: String,
		});

		const visitor = await findGuest(this.urlParams.token);
		if (!visitor) {
			throw new Meteor.Error('invalid-token');
		}

		const room = findRoom(this.urlParams.token, this.urlParams.rid);
		if (!room) {
			throw new Meteor.Error('invalid-room');
		}

		const agent = room && room.servedBy && findAgent(room.servedBy._id);
		if (!agent) {
			throw new Meteor.Error('invalid-agent');
		}

		return API.v1.success({ agent });
	},
});

API.v1.addRoute('livechat/agent.next/:token', {
	async get() {
		check(this.urlParams, {
			token: String,
		});

		check(this.queryParams, {
			department: Match.Maybe(String),
		});

		const { token } = this.urlParams;
		const room = findOpenRoom(token);
		if (room) {
			return API.v1.success();
		}

		let { department } = this.queryParams;
		if (!department) {
			const requireDeparment = Livechat.getRequiredDepartment();
			if (requireDeparment) {
				department = requireDeparment._id;
			}
		}

		const agentData = await Livechat.getNextAgent(department);
		if (!agentData) {
			throw new Meteor.Error('agent-not-found');
		}

		const agent = findAgent(agentData.agentId);
		if (!agent) {
			throw new Meteor.Error('invalid-agent');
		}

		return API.v1.success({ agent });
	},
});
