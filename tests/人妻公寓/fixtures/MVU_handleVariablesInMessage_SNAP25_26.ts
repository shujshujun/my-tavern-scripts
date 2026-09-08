/* Copyright (c) 2025 MagicalAstrogy & StageDog.

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
 */
export async function handleVariablesInMessage(message_id: number) {
    const chat_message = getChatMessages(message_id).at(-1);
    if (!chat_message) {
        return;
    }

    let message_content = chat_message.message;

    if (chat_message.role === 'assistant' && message_content.length < 5) {
        return;
    }
    //在重构后 getLastValidVariable 的语义改编为了 [0, message_id) 区间
    const request_message_id = message_id === 0 ? 1 : message_id;
    const variables = getLastValidVariable(request_message_id);
    const settings = useDataStore().settings;
    if (!_.has(variables, 'stat_data')) {
        return;
    }

    const has_variable_modified = await updateVariables(message_content, variables);
    if (has_variable_modified && chat_message.role !== 'user') {
        const context: UpdateContext = {
            variables: variables,
            message_content: message_content,
        };
        await eventEmit(variable_events.BEFORE_MESSAGE_UPDATE, context);
        message_content = context.message_content;
    }
    const updater = (data: Record<string, any>) => {
        data.initialized_lorebooks = variables.initialized_lorebooks;
        data.stat_data = variables.stat_data;
        if (variables.schema !== undefined) {
            _.set(data, 'schema', variables.schema);
        } else {
            _.unset(data, 'schema');
        }
        if (variables.display_data !== undefined) {
            _.set(data, 'display_data', variables.display_data);
        } else {
            _.unset(data, 'display_data');
        }
        if (variables.delta_data !== undefined) {
            _.set(data, 'delta_data', variables.delta_data);
        } else {
            _.unset(data, 'delta_data');
        }
        return data;
    };
    if (has_variable_modified && settings.兼容性.更新到聊天变量) {
        await updateVariablesWith(updater, { type: 'chat' });
    }
    await updateVariablesWith(updater, { type: 'message', message_id: message_id });

    if (chat_message.role !== 'user') {
        if (!message_content.includes('<StatusPlaceHolderImpl/>')) {
            message_content += '\n\n<StatusPlaceHolderImpl/>';
        }
        if (message_content.includes('<status_current_variable>')) {
            message_content = message_content.replaceAll(
                /<(status_current_variable)>(?:(?!<\1>).)*<\/\1?>/gis,
                ''
            );
        }
        await setChatMessages(
            [
                {
                    message_id: message_id,
                    message: message_content,
                },
            ],
            {
                refresh: 'affected',
            }
        );
    }
}
