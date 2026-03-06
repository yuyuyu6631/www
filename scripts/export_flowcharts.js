import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOC_PATH = path.join(__dirname, '../docs/system_flowcharts.md');
const OUTPUT_DIR = path.join(__dirname, '../flowcharts_png');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function exportFlowcharts() {
    console.log('🚀 开始提取 Mermaid 代码并调用在线接口转换为 PNG...');
    const content = fs.readFileSync(DOC_PATH, 'utf-8');

    // 匹配标题和相邻的 mermaid 代码块
    const regex = /## \d+\.\s+([^\r\n]+)[\s\S]*?```mermaid\r?\n([\s\S]*?)```/g;
    let match;
    let count = 0;

    while ((match = regex.exec(content)) !== null) {
        const title = match[1].trim().replace(/[\\/:*?"<>|]/g, '_');
        const mermaidCode = match[2].trim();

        // mermaid.ink 需要将 JSON 配置 base64 编码，其中 mermaid 配置本身必须是字符串
        const state = {
            code: mermaidCode,
            mermaid: JSON.stringify({ theme: 'default' }),
            autoSync: true,
            updateDiagram: true
        };

        // 使用 URL-safe 方式进行 Base64 编码
        const base64Data = Buffer.from(JSON.stringify(state), 'utf-8').toString('base64');

        // 构造请求 URL -> 这是 mermaid-live-editor 的格式，mermaid.ink 兼容它
        const url = `https://mermaid.ink/img/${base64Data}`;

        console.log(`正在转换 [${title}] ...`);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP 错误: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            const outputPath = path.join(OUTPUT_DIR, `${title}.png`);
            fs.writeFileSync(outputPath, Buffer.from(buffer));
            console.log(`✅ 保存成功: ${outputPath}`);
            count++;
        } catch (err) {
            console.error(`❌ 转换 [${title}] 失败:`, err.message);
        }
    }

    console.log(`🎉 流程图 PNG 转换完成！共生成 ${count} 张图，已保存在 flowcharts_png 目录。`);
}

exportFlowcharts();
