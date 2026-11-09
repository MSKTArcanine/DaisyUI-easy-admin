// the width configured in PHP always wins; the width selected by users with the layout
// toggles is only remembered when there's no configured width
const eaLayoutWidth = (layoutPart) => {
    const configuredWidth = document.body.getAttribute(`data-ea-${layoutPart}-width`);
    if ('true' === document.body.getAttribute(`data-ea-${layoutPart}-width-configured`)) {
        return configuredWidth;
    }

    const storedWidth = localStorage.getItem(`ea/${layoutPart}/width`);
    const alternative = layoutPart === 'sidebar' ? 'compact' : 'full';
    return ['normal', alternative].includes(storedWidth) ? storedWidth : configuredWidth;
};
for (const part of ['content', 'sidebar']) {
    const alternative = part === 'sidebar' ? 'compact' : 'full';
    document.body.classList.remove(`ea-${part}-width-normal`, `ea-${part}-width-${alternative}`);
    document.body.classList.add(`ea-${part}-width-${eaLayoutWidth(part)}`);
}
