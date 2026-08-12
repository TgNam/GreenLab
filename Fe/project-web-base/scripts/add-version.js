const fs = require('fs');
const path = require('path');

// Tạo version từ ngày tháng và số lần build
function generateVersion() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // Đọc số lần build trong ngày từ file
    const buildCountFile = path.join(__dirname, '../.build-count');
    let buildCount = now.getTime();
    
    // try {
    //     if (fs.existsSync(buildCountFile)) {
    //         const content = fs.readFileSync(buildCountFile, 'utf8');
    //         const lastDate = content.split('-')[0];
    //         if (lastDate === dateStr) {
    //             buildCount = parseInt(content.split('-')[1]) + 1;
    //         }
    //     }
    // } catch (e) {
    //     // Nếu lỗi, bắt đầu từ 1
    // }
    
    // Lưu số lần build
    fs.writeFileSync(buildCountFile, `${dateStr}-${buildCount}`, 'utf8');
    
    // Format: YYYYMMDD-XXX (3 số)
    const version = `${dateStr}-${String(buildCount).padStart(6, '0')}`;
    return version;
}

// Thêm version parameter vào các file trong index.html
function addVersionToIndex(version) {
    const distPath = path.join(__dirname, '../dist/vuexy');
    const indexPath = path.join(distPath, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('index.html not found at:', indexPath);
        return false;
    }
    
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    let modified = false;
    let scriptCount = 0;
    let linkCount = 0;
    
    // Thêm version vào các thẻ script
    indexContent = indexContent.replace(
        /(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
        (match, prefix, src, suffix) => {
            // Bỏ qua các script external (http/https)
            if (src.startsWith('http://') || src.startsWith('https://')) {
                return match;
            }
            // Bỏ qua các script inline
            if (src.trim() === '' || src.startsWith('data:') || !src.includes('.')) {
                return match;
            }
            // Bỏ qua nếu đã có ver parameter
            if (src.includes('ver=')) {
                return match;
            }
            modified = true;
            scriptCount++;
            const separator = src.includes('?') ? '&' : '?';
            return `${prefix}${src}${separator}ver=${version}${suffix}`;
        }
    );
    
    // Thêm version vào các thẻ link (CSS, JS, preload, prefetch, etc.)
    indexContent = indexContent.replace(
        /(<link[^>]*href=["'])([^"']+)(["'][^>]*>)/gi,
        (match, prefix, href, suffix) => {
            // Bỏ qua các link external
            if (href.startsWith('http://') || href.startsWith('https://')) {
                return match;
            }
            // Chỉ xử lý các file CSS/JS
            if (!href.match(/\.(css|js)(\?|$)/i)) {
                return match;
            }
            // Bỏ qua nếu đã có ver parameter
            if (href.includes('ver=')) {
                return match;
            }
            modified = true;
            linkCount++;
            const separator = href.includes('?') ? '&' : '?';
            return `${prefix}${href}${separator}ver=${version}${suffix}`;
        }
    );
    
    if (modified) {
        fs.writeFileSync(indexPath, indexContent, 'utf8');
        console.log(`✓ Version ${version} added to index.html:`);
        console.log(`  - ${scriptCount} script(s)`);
        console.log(`  - ${linkCount} stylesheet/link(s)`);
        return true;
    } else {
        console.log(`⚠ No files found to add version to`);
        return false;
    }
}

// Tìm tất cả các file component HTML
function findAllComponentHtmlFiles() {
    const srcPath = path.join(__dirname, '../src/app');
    const componentFiles = [];
    
    function walkDir(dir) {
        if (!fs.existsSync(dir)) {
            return;
        }
        
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                walkDir(filePath);
            } else if (file.endsWith('.component.html')) {
                componentFiles.push(filePath);
            }
        }
    }
    
    walkDir(srcPath);
    return componentFiles;
}

// Thêm version vào một file component HTML
function addVersionToComponentFile(filePath, version) {
    if (!fs.existsSync(filePath)) {
        return { modified: false, scriptCount: 0, linkCount: 0, imgCount: 0 };
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let scriptCount = 0;
    let linkCount = 0;
    let imgCount = 0;
    
    // Thêm version vào các thẻ script
    content = content.replace(
        /(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
        (match, prefix, src, suffix) => {
            // Bỏ qua các script external (http/https hoặc //)
            if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
                return match;
            }
            // Bỏ qua các script inline
            if (src.trim() === '' || src.startsWith('data:') || !src.includes('.')) {
                return match;
            }
            // Bỏ qua nếu đã có ver parameter
            if (src.includes('ver=')) {
                return match;
            }
            modified = true;
            scriptCount++;
            const separator = src.includes('?') ? '&' : '?';
            return `${prefix}${src}${separator}ver=${version}${suffix}`;
        }
    );
    
    // Thêm version vào các thẻ link (CSS, JS, preload, prefetch, etc.)
    content = content.replace(
        /(<link[^>]*href=["'])([^"']+)(["'][^>]*>)/gi,
        (match, prefix, href, suffix) => {
            // Bỏ qua các link external (http/https hoặc //)
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                return match;
            }
            // Chỉ xử lý các file CSS/JS
            if (!href.match(/\.(css|js)(\?|$)/i)) {
                return match;
            }
            // Bỏ qua nếu đã có ver parameter
            if (href.includes('ver=')) {
                return match;
            }
            modified = true;
            linkCount++;
            const separator = href.includes('?') ? '&' : '?';
            return `${prefix}${href}${separator}ver=${version}${suffix}`;
        }
    );
    
    // Thêm version vào các thẻ img (nếu cần)
    content = content.replace(
        /(<img[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
        (match, prefix, src, suffix) => {
            // Bỏ qua các image external (http/https hoặc //)
            if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
                return match;
            }
            // Bỏ qua data URI
            if (src.startsWith('data:')) {
                return match;
            }
            // Bỏ qua nếu đã có ver parameter
            if (src.includes('ver=')) {
                return match;
            }
            modified = true;
            imgCount++;
            const separator = src.includes('?') ? '&' : '?';
            return `${prefix}${src}${separator}ver=${version}${suffix}`;
        }
    );
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
    
    return { modified, scriptCount, linkCount, imgCount };
}

// Thêm version vào tất cả các file component HTML
function addVersionToAllComponentFiles(version) {
    const componentFiles = findAllComponentHtmlFiles();
    
    if (componentFiles.length === 0) {
        console.log(`⚠ No component HTML files found`);
        return { processed: 0, modified: 0, totalScripts: 0, totalLinks: 0, totalImgs: 0 };
    }
    
    let processed = 0;
    let modified = 0;
    let totalScripts = 0;
    let totalLinks = 0;
    let totalImgs = 0;
    
    console.log(`\nProcessing ${componentFiles.length} component HTML files...`);
    
    for (const filePath of componentFiles) {
        const result = addVersionToComponentFile(filePath, version);
        processed++;
        
        if (result.modified) {
            modified++;
            totalScripts += result.scriptCount;
            totalLinks += result.linkCount;
            totalImgs += result.imgCount;
            
            // Lấy tên file để hiển thị
            const relativePath = path.relative(path.join(__dirname, '../src'), filePath);
            console.log(`  ✓ ${relativePath} (${result.scriptCount} scripts, ${result.linkCount} links, ${result.imgCount} images)`);
        }
    }
    
    console.log(`\n✓ Version ${version} added to component HTML files:`);
    console.log(`  - ${modified}/${processed} files modified`);
    console.log(`  - ${totalScripts} script(s)`);
    console.log(`  - ${totalLinks} stylesheet/link(s)`);
    console.log(`  - ${totalImgs} image(s)`);
    
    return { processed, modified, totalScripts, totalLinks, totalImgs };
}

// Thêm version vào manifest.webmanifest
function addVersionToManifest(version) {
    const distPath = path.join(__dirname, '../dist/vuexy');
    const manifestPath = path.join(distPath, 'assets/manifest.webmanifest');
    
    if (!fs.existsSync(manifestPath)) {
        console.log(`⚠ manifest.webmanifest not found at ${manifestPath}, skipping...`);
        return false;
    }
    
    try {
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        // Thêm version vào manifest
        manifest.version = version;
        
        // Thêm version vào các icon URLs nếu cần
        if (manifest.icons && Array.isArray(manifest.icons)) {
            manifest.icons = manifest.icons.map(icon => {
                if (icon.src && !icon.src.includes('ver=') && !icon.src.startsWith('http')) {
                    const separator = icon.src.includes('?') ? '&' : '?';
                    icon.src = `${icon.src}${separator}ver=${version}`;
                }
                return icon;
            });
        }
        
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        console.log(`✓ Version ${version} added to manifest.webmanifest`);
        return true;
    } catch (error) {
        console.error(`✗ Error updating manifest:`, error.message);
        return false;
    }
}

// Main
const version = generateVersion();
console.log(`Generated version: ${version}`);
addVersionToAllComponentFiles(version);
addVersionToIndex(version);
addVersionToManifest(version);