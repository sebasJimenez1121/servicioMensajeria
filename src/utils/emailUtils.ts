import { promises as fs } from 'fs';
import * as path from 'path';

export async function loadEmailTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    return await fs.readFile(templatePath, 'utf-8');
}

export function replacePlaceholders(template: string, placeholders: Record<string, string>): string {
    let populatedTemplate = template;
    for (const [key, value] of Object.entries(placeholders)) {
        populatedTemplate = populatedTemplate.replace(`{{${key}}}`, value);
    }
    return populatedTemplate;
}
