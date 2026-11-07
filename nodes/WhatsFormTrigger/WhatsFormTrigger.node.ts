import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type IHttpRequestMethods,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';

async function whatsFormRequest(
	this: IHookFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	path: string,
	{ body, allowNotFound = false }: { body?: IDataObject; allowNotFound?: boolean } = {},
) {
	const credentials = await this.getCredentials('whatsFormApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/$/, '');
	let response;
	try {
		response = await this.helpers.httpRequestWithAuthentication.call(this, 'whatsFormApi', {
			method,
			url: `${baseUrl}/integration/n8n${path}`,
			body,
			json: true,
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}

	if (response.statusCode === 404 && allowNotFound) return null;
	if (response.statusCode >= 400) {
		throw new NodeApiError(this.getNode(), (response.body ?? {}) as JsonObject, {
			httpCode: String(response.statusCode),
		});
	}
	return response.body;
}

export class WhatsFormTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'WhatsForm Trigger',
		name: 'whatsFormTrigger',
		icon: 'file:../../icons/whatsform.png',
		group: ['trigger'],
		version: 1,
		subtitle: 'New response',
		description: 'Starts the workflow when a form gets a new response',
		defaults: {
			name: 'WhatsForm Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'whatsFormApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Form Name or ID',
				name: 'formId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getForms',
				},
				required: true,
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			},
		],
	};

	methods = {
		loadOptions: {
			async getForms(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const forms = (await whatsFormRequest.call(this, 'GET', '/forms')) as Array<{
					id: string;
					name: string;
				}>;
				return forms.map((form) => ({ name: form.name || form.id, value: form.id }));
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.hookId === undefined) return false;

				const path = `/hooks/${webhookData.hookId}`;
				const hook = (await whatsFormRequest.call(this, 'GET', path, {
					allowNotFound: true,
				})) as IDataObject | null;
				if (
					hook &&
					hook.hookUrl === this.getNodeWebhookUrl('default') &&
					hook.formId === this.getNodeParameter('formId')
				) {
					return true;
				}
				// the form was changed since the hook was created
				if (hook) await whatsFormRequest.call(this, 'DELETE', path, { allowNotFound: true });
				delete webhookData.hookId;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const { id } = (await whatsFormRequest.call(this, 'POST', '/hooks', {
					body: {
						formId: this.getNodeParameter('formId') as string,
						hookUrl: this.getNodeWebhookUrl('default') as string,
					},
				})) as { id: string };
				webhookData.hookId = id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.hookId !== undefined) {
					await whatsFormRequest.call(this, 'DELETE', `/hooks/${webhookData.hookId}`, {
						allowNotFound: true,
					});
					delete webhookData.hookId;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		return {
			workflowData: [this.helpers.returnJsonArray(this.getBodyData())],
		};
	}
}
