if (!document.getElementById('sidebar-hover-trigger-left')) {
    const openSidebarHandler = () => {
        browser.runtime.sendMessage({ command: "openSidebar" });
    };

    const leftTrigger = document.createElement('div');
    leftTrigger.id = 'sidebar-hover-trigger-left';
    document.body.appendChild(leftTrigger);
    leftTrigger.addEventListener('mouseenter', openSidebarHandler);

    const rightTrigger = document.createElement('div');
    rightTrigger.id = 'sidebar-hover-trigger-right';
    document.body.appendChild(rightTrigger);
    rightTrigger.addEventListener('mouseenter', openSidebarHandler);
}