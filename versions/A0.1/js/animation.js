const Animation = {
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

        const existingYaos = container.querySelectorAll('.yao');
        if (existingYaos.length === 0) {
            container.appendChild(el);
        } else {
            container.insertBefore(el, existingYaos[0]);
        }

        requestAnimationFrame(() => {
            el.classList.add('yao-visible');
        });
    }
};
