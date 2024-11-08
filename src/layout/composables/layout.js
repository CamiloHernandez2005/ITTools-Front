import { computed, reactive, readonly, onMounted } from 'vue';

// Configuración inicial del layout
const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'teal',
    surface: 'soho',
    darkTheme: false,
    menuMode: 'static'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null,
    sidebarCollapsed: false,
    activeSubMenuItems: {} // Añadido para rastrear el estado de los submenús
});

export function useLayout() {
    const applyColors = () => {
        document.documentElement.style.setProperty('--primary-color', layoutConfig.primary);
        document.documentElement.style.setProperty('--surface-color', layoutConfig.surface);
    };

    onMounted(() => {
        const savedDarkMode = localStorage.getItem('darkTheme');
        if (savedDarkMode === 'true') {
            layoutConfig.darkTheme = true;
            document.documentElement.classList.add('app-dark');
        }

        const savedPrimary = localStorage.getItem('primary');
        if (savedPrimary) {
            layoutConfig.primary = savedPrimary;
        }

        const savedSurface = localStorage.getItem('surface');
        if (savedSurface) {
            layoutConfig.surface = savedSurface;
        }

        applyColors();
    });

    const setSidebarState = (collapsed) => {
        layoutState.sidebarCollapsed = collapsed;
    };

    const setPrimary = (value) => {
        layoutConfig.primary = value || 'teal';
        localStorage.setItem('primary', layoutConfig.primary);
        applyColors();
    };

    const setSurface = (value) => {
        layoutConfig.surface = value || 'soho';
        localStorage.setItem('surface', layoutConfig.surface);
        applyColors();
    };

    const setPreset = (value) => {
        layoutConfig.preset = value;
    };

    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = item.value || item;
    };

    const setMenuMode = (mode) => {
        layoutConfig.menuMode = mode;
    };

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();
            return;
        }

        document.startViewTransition(() => executeDarkModeToggle());
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        document.documentElement.classList.toggle('app-dark');
        localStorage.setItem('darkTheme', layoutConfig.darkTheme.toString());
    };

    const onMenuToggle = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth > 991) {
            layoutState.sidebarCollapsed = !layoutState.sidebarCollapsed;
        } else {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }
    };

    const resetMenu = () => {
        layoutState.overlayMenuActive = false;
        layoutState.staticMenuMobileActive = false;
        layoutState.menuHoverActive = false;
        layoutState.activeSubMenuItems = {}; // Restablecer el estado de los submenús
    };

    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);

    const isDarkTheme = computed(() => layoutConfig.darkTheme);

    const getPrimary = computed(() => layoutConfig.primary);

    const getSurface = computed(() => layoutConfig.surface);

    return {
        layoutConfig: readonly(layoutConfig),
        layoutState: readonly(layoutState),
        onMenuToggle,
        isSidebarActive,
        setSidebarState,
        isDarkTheme,
        getPrimary,
        getSurface,
        setActiveMenuItem,
        toggleDarkMode,
        setPrimary,
        setSurface,
        setPreset,
        resetMenu,
        setMenuMode
    };
}
