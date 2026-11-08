import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WhatsFormApi implements ICredentialType {
	name = 'whatsFormApi';

	displayName = 'WhatsForm API';

	icon: Icon = 'file:../icons/whatsform.png';

	documentationUrl = 'https://github.com/microdotcompany/whatsform-n8n-node#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: "Create one in WhatsForm under your form's Settings → Integrations → n8n",
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://app.whatsform.com',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}/integration/n8n',
			url: '/me',
			method: 'GET',
		},
	};
}
