const Animation = {
    // [FIX C3] drawGua 已由 animateCoinFlip 替代（app.js 无调用点），保留以兼容未来恢复
    drawGua(container, yao) {
        const el = document.createElement('div');
        el.className = 'yao';

        if (yao.type === 'yang') {
            el.classList.add('yao-yang');
            el.textContent = '━━━';
        } else {
            el.classList.add('yao-yin');
            el.textContent = '╌ ╌';
        }

        if (yao.changing) {
            el.classList.add('yao-changing');
            const mark = document.createElement('span');
            mark.className = 'yao-changing-mark';
            mark.textContent = yao.type === 'yang' ? '●' : '×';
            el.appendChild(mark);
        }

        const existingYaos = container.querySelectorAll('.yao, .coin-flip');
        if (existingYaos.length === 0) {
            container.appendChild(el);
        } else {
            container.insertBefore(el, existingYaos[0]);
        }

        requestAnimationFrame(() => {
            el.classList.add('yao-visible');
        });
    },

    animateCoinFlip(container, yao) {
        const el = document.createElement('div');
        el.className = 'yao coin-flip';
        if (yao.changing) el.classList.add('coin-changing');

        const icon = document.createElement('span');
        icon.className = 'coin-icon';
        icon.textContent = yao.type === 'yang' ? '🟡' : '⚪';
        el.appendChild(icon);

        const text = document.createElement('span');
        text.className = 'coin-text';
        text.textContent = yao.type === 'yang' ? '━━━' : '╌ ╌';
        el.appendChild(text);

        if (yao.changing) {
            el.classList.add('yao-changing');
            const mark = document.createElement('span');
            mark.className = 'yao-changing-mark';
            mark.textContent = yao.type === 'yang' ? '●' : '×';
            el.appendChild(mark);
        }

        const existingYaos = container.querySelectorAll('.yao, .coin-flip');
        if (existingYaos.length === 0) {
            container.appendChild(el);
        } else {
            container.insertBefore(el, existingYaos[0]);
        }
    }
};
