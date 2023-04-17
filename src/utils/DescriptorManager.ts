// Obsidian
import Weaver from 'main';
import { FileSystemAdapter, Plugin, normalizePath } from 'obsidian';

// Third-party modules
import { BSON, EJSON, ObjectId } from '../js/BsonWrapper';

// Interfaces
import { IChatMessage, IChatSession, IChatThread, IDescriptor } from 'interfaces/IChats';

// Local modules
import { FileIOManager } from 'helpers/FileIOManager';
import { FileWizard } from './FileWizard';

export class DescriptorManager {
	static async descriptorExists(plugin: Weaver): Promise<boolean> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const filePath = `/${plugin.settings.weaverFolderPath}/descriptor.bson`;
			return await adapter.exists(filePath);
		} catch (error) {
			console.error('Error checking descriptor existence:', error);
			throw error;
		}
	}

	static async writeDescriptor(plugin: Weaver, data: object): Promise<void> {
		try {
			const adapter = plugin.app.vault.adapter as FileSystemAdapter;
			const descriptorPath = `/${plugin.settings.weaverFolderPath}/descriptor.bson`;
			const bsonData = BSON.serialize(data);
			const buffer = Buffer.from(bsonData.buffer);
			await adapter.writeBinary(descriptorPath, buffer);
		} catch (error) {
			console.error('Error writing descriptor:', error);
			throw error;
		}
	}

    static async readDescriptor(plugin: Weaver): Promise<any> {
        try {
            const adapter = plugin.app.vault.adapter as FileSystemAdapter;
            const descriptorPath = `/${plugin.settings.weaverFolderPath}/descriptor.bson`;

            if (!await adapter.exists(descriptorPath)) {
                const emptyDescriptor: IDescriptor = {
                    version: "2.0.0",
					identifier: "obsidian-weaver",
                    threads: [
                        {
							description: "",
                            id: 0,
                            title: "base",
                            conversations: [],
                        }
                    ]
                };

				this.writeDescriptor(plugin, emptyDescriptor);
            }

            const arrayBuffer = await adapter.readBinary(descriptorPath);
            const bsonData = new Uint8Array(arrayBuffer);
            const deserializedData = BSON.deserialize(bsonData);

			if(FileWizard.isSupportedFile(deserializedData)) {
				throw `Unsupported file: descriptor.bson. The file must have the "obsidian-weaver" identifier.`;
			}

            return deserializedData;
        } catch (error) {
            console.error('Error reading descriptor:', error);
            throw error;
        }
    }
}
