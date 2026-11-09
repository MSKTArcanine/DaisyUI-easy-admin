// the width configured in PHP always wins; the width selected by users with the layout
// toggles is only remembered when there's no configured width
const eaLayoutWidth = (layoutPart) => {
    const configuredWidth = document.body.getAttribute(`data-ea-${layoutPart}-width`);
    if ('true' === document.body.getAttribute(`data-ea-${layoutPart}-width-configured`)) {
        return configuredWidth;
    }

    return localStorage.getItem(`ea/${layoutPart}/width`) || configuredWidth;
};
document.body.classList.add(
    `ea-content-width-${eaLayoutWidth('content')}`,
    `ea-sidebar-width-${eaLayoutWidth('sidebar')}`
);
