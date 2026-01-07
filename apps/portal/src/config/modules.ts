/**
 * Module Navigation Configuration
 * All 12 ServiceOS Modules with Vietnamese labels
 */

export interface ModuleConfig {
    id: string;
    code: string;
    label: string;
    description: string;
    href: string;
    iconLetter: string;
    color: string;
    subModules?: SubModuleConfig[];
}

export interface SubModuleConfig {
    id: string;
    label: string;
    href: string;
}

// ============================================================================
// MODULE DEFINITIONS (12 Modules)
// ============================================================================

export const MODULES: ModuleConfig[] = [
    {
        id: "core",
        code: "CORE",
        label: "Quản trị hệ thống",
        description: "Quản lý doanh nghiệp, người dùng, phân quyền",
        href: "/dashboard/core",
        iconLetter: "C",
        color: "#6366F1", // Indigo
        subModules: [
            { id: "tenants", label: "Doanh nghiệp", href: "/dashboard/core/tenants" },
            { id: "users", label: "Người dùng", href: "/dashboard/core/users" },
            { id: "roles", label: "Phân quyền", href: "/dashboard/core/roles" },
            { id: "settings", label: "Cài đặt", href: "/dashboard/core/settings" },
        ],
    },
    {
        id: "techmate",
        code: "TECHMATE",
        label: "Quản lý công việc",
        description: "Tạo, phân công và theo dõi công việc",
        href: "/dashboard/jobs",
        iconLetter: "T",
        color: "#10B981", // Emerald
        subModules: [
            { id: "jobs", label: "Danh sách công việc", href: "/dashboard/jobs" },
            { id: "calendar", label: "Lịch trình", href: "/dashboard/jobs/calendar" },
            { id: "templates", label: "Mẫu công việc", href: "/dashboard/jobs/templates" },
        ],
    },
    {
        id: "stockpile",
        code: "STOCKPILE",
        label: "Kho & Vật tư",
        description: "Quản lý kho hàng, vật tư, tồn kho",
        href: "/dashboard/inventory",
        iconLetter: "S",
        color: "#F59E0B", // Amber
        subModules: [
            { id: "products", label: "Sản phẩm", href: "/dashboard/inventory/products" },
            { id: "categories", label: "Danh mục", href: "/dashboard/inventory/categories" },
            { id: "stock", label: "Tồn kho", href: "/dashboard/inventory/stock" },
            { id: "movements", label: "Xuất nhập", href: "/dashboard/inventory/movements" },
        ],
    },
    {
        id: "shiftsquad",
        code: "SHIFTSQUAD",
        label: "Nhân sự & Ca làm",
        description: "Quản lý nhân viên, ca làm việc, chấm công",
        href: "/dashboard/hr",
        iconLetter: "H",
        color: "#EC4899", // Pink
        subModules: [
            { id: "employees", label: "Nhân viên", href: "/dashboard/hr/employees" },
            { id: "shifts", label: "Ca làm việc", href: "/dashboard/hr/shifts" },
            { id: "attendance", label: "Chấm công", href: "/dashboard/hr/attendance" },
            { id: "payroll", label: "Bảng lương", href: "/dashboard/hr/payroll" },
        ],
    },
    {
        id: "assettrack",
        code: "ASSETTRACK",
        label: "Tài sản & Thiết bị",
        description: "Theo dõi tài sản, thiết bị, bảo trì",
        href: "/dashboard/assets",
        iconLetter: "A",
        color: "#8B5CF6", // Violet
        subModules: [
            { id: "assets", label: "Danh sách tài sản", href: "/dashboard/assets" },
            { id: "maintenance", label: "Bảo trì", href: "/dashboard/assets/maintenance" },
            { id: "categories", label: "Loại tài sản", href: "/dashboard/assets/categories" },
        ],
    },
    {
        id: "routeoptima",
        code: "ROUTEOPTIMA",
        label: "Điều phối lộ trình",
        description: "Tối ưu hóa lộ trình, theo dõi GPS",
        href: "/dashboard/routes",
        iconLetter: "R",
        color: "#14B8A6", // Teal
        subModules: [
            { id: "routes", label: "Lộ trình", href: "/dashboard/routes" },
            { id: "zones", label: "Vùng phụ trách", href: "/dashboard/routes/zones" },
            { id: "tracking", label: "Theo dõi GPS", href: "/dashboard/routes/tracking" },
        ],
    },
    {
        id: "quotemaster",
        code: "QUOTEMASTER",
        label: "Bao gia & Hợp đồng",
        description: "Tạo bao giá, quản lý hợp đồng",
        href: "/dashboard/quotes",
        iconLetter: "Q",
        color: "#0EA5E9", // Sky
        subModules: [
            { id: "quotes", label: "Bao giá", href: "/dashboard/quotes" },
            { id: "contracts", label: "Hợp đồng", href: "/dashboard/quotes/contracts" },
            { id: "templates", label: "Mẫu bao giá", href: "/dashboard/quotes/templates" },
        ],
    },
    {
        id: "cashflow",
        code: "CASHFLOW",
        label: "Đóng tiền nội bộ",
        description: "Thu chi, công nợ, báo cáo tài chính",
        href: "/dashboard/finance",
        iconLetter: "F",
        color: "#22C55E", // Green
        subModules: [
            { id: "transactions", label: "Giao dịch", href: "/dashboard/finance/transactions" },
            { id: "invoices", label: "Hóa đơn", href: "/dashboard/finance/invoices" },
            { id: "reports", label: "Báo cáo", href: "/dashboard/finance/reports" },
        ],
    },
    {
        id: "customerportal",
        code: "CUSTOMERPORTAL",
        label: "Công khach hàng",
        description: "Quản lý khách hàng, CRM",
        href: "/dashboard/customers",
        iconLetter: "K",
        color: "#F97316", // Orange
        subModules: [
            { id: "customers", label: "Khách hàng", href: "/dashboard/customers" },
            { id: "contacts", label: "Liên hệ", href: "/dashboard/customers/contacts" },
            { id: "feedback", label: "Phản hồi", href: "/dashboard/customers/feedback" },
        ],
    },
    {
        id: "procurepool",
        code: "PROCUREPOOL",
        label: "Mua hàng NCC",
        description: "Quản lý nhà cung cấp, đơn mua",
        href: "/dashboard/procurement",
        iconLetter: "N",
        color: "#A855F7", // Purple
        subModules: [
            { id: "suppliers", label: "Nhà cung cấp", href: "/dashboard/procurement/suppliers" },
            { id: "orders", label: "Đơn mua hàng", href: "/dashboard/procurement/orders" },
            { id: "receiving", label: "Nhập kho", href: "/dashboard/procurement/receiving" },
        ],
    },
    {
        id: "notification",
        code: "NOTIFICATION",
        label: "Trung tâm thông báo",
        description: "Thông báo, cảnh báo, lịch sử",
        href: "/dashboard/notifications",
        iconLetter: "B",
        color: "#EF4444", // Red
        subModules: [
            { id: "inbox", label: "Hop thu", href: "/dashboard/notifications" },
            { id: "settings", label: "Cai dat", href: "/dashboard/notifications/settings" },
        ],
    },
    {
        id: "billing",
        code: "BILLING",
        label: "Gói cuộc & Thanh toán",
        description: "Quản lý gói cuộc, subscription",
        href: "/dashboard/billing",
        iconLetter: "G",
        color: "#06B6D4", // Cyan
        subModules: [
            { id: "plans", label: "Goi cuoc", href: "/dashboard/billing/plans" },
            { id: "subscriptions", label: "Dang ky", href: "/dashboard/billing/subscriptions" },
            { id: "payments", label: "Thanh toan", href: "/dashboard/billing/payments" },
        ],
    },
];

// ============================================================================
// QUICK ACCESS (Demo/Test modules - keep existing)
// ============================================================================

export const QUICK_ACCESS = [
    { label: "Tong quan", href: "/dashboard", iconLetter: "D" },
    { label: "Luu tru Demo", href: "/dashboard/storage", iconLetter: "L" },
    { label: "Real-time Demo", href: "/dashboard/realtime", iconLetter: "R" },
    { label: "Ho so ca nhan", href: "/dashboard/profile", iconLetter: "P" },
];

// ============================================================================
// HELPERS
// ============================================================================

export const getModuleByHref = (href: string): ModuleConfig | undefined => {
    return MODULES.find((m) => href.startsWith(m.href));
};

export const getModuleById = (id: string): ModuleConfig | undefined => {
    return MODULES.find((m) => m.id === id);
};
