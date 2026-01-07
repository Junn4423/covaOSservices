/**
 * ============================================================
 * TEST REPORTER - Hệ thống báo cáo và chấm điểm
 * ServiceOS E2E Test Suite
 * ============================================================
 * 
 *  Mục đích:
 * - Thu thập kết quả test từ tất cả các module
 * - Tính toán tỷ lệ thành công
 * - Liệt kê các lỗi và cảnh báo
 * - Chấm điểm tổng thể hệ thống
 */

import { TestConfig } from './test.config';

// ============================================================
// INTERFACES
// ============================================================

export interface KetQuaTest {
    tenTest: string;
    endpoint: string;
    method: string;
    thanhCong: boolean;
    thoiGianMs: number;
    statusCode?: number;
    loiChiTiet?: string;
    loaiLoi?: 'VALIDATION' | 'BUSINESS_LOGIC' | 'SERVER_ERROR' | 'TIMEOUT' | 'UNAUTHORIZED';
}

export interface CanhBao {
    loai: 'BUSINESS_LOGIC' | 'SECURITY' | 'PERFORMANCE' | 'DATA_INTEGRITY';
    moTa: string;
    mucDoNghiemTrong: 'THẤP' | 'TRUNG_BÌNH' | 'CAO';
    endpoint?: string;
}

export interface BaoCaoTongHop {
    tongSoApiTest: number;
    soApiThanhCong: number;
    soApiThatBai: number;
    tyLeThanhCong: number;
    diemTongThe: string;
    danhSachLoi: KetQuaTest[];
    danhSachCanhBao: CanhBao[];
    thoiGianTongMs: number;
    timestamp: Date;
}

// ============================================================
// TEST REPORTER CLASS
// ============================================================

export class TestReporter {
    private ketQuaTests: KetQuaTest[] = [];
    private canhBaos: CanhBao[] = [];
    private thoiGianBatDau: number = 0;

    constructor() {
        this.thoiGianBatDau = Date.now();
    }

    // ============================================================
    // GHI NHẬN KẾT QUẢ TEST
    // ============================================================
    ghiNhanKetQua(ketQua: KetQuaTest): void {
        this.ketQuaTests.push({
            ...ketQua,
            thoiGianMs: ketQua.thoiGianMs || 0,
        });

        // Log realtime
        const icon = ketQua.thanhCong ? '' : '';
        console.log(
            `${icon} [${ketQua.method}] ${ketQua.endpoint} - ${ketQua.tenTest} (${ketQua.thoiGianMs}ms)`
        );
    }

    // ============================================================
    // GHI NHẬN CẢNH BÁO BUSINESS LOGIC
    // ============================================================
    ghiNhanCanhBao(canhBao: CanhBao): void {
        this.canhBaos.push(canhBao);
        
        const icon = canhBao.mucDoNghiemTrong === 'CAO' ? '' : 
                     canhBao.mucDoNghiemTrong === 'TRUNG_BÌNH' ? '' : '💡';
        console.log(`${icon} CẢNH BÁO [${canhBao.loai}]: ${canhBao.moTa}`);
    }

    // ============================================================
    // TÍNH TOÁN ĐIỂM TỔNG THỂ
    // ============================================================
    private tinhDiemTongThe(tyLeThanhCong: number): string {
        const grades = TestConfig.GRADES;
        
        if (tyLeThanhCong >= grades.S.min) return grades.S.label;
        if (tyLeThanhCong >= grades.A.min) return grades.A.label;
        if (tyLeThanhCong >= grades.B.min) return grades.B.label;
        if (tyLeThanhCong >= grades.C.min) return grades.C.label;
        return grades.F.label;
    }

    // ============================================================
    // TẠO BÁO CÁO TỔNG HỢP
    // ============================================================
    taoBaoCao(): BaoCaoTongHop {
        const tongSoTest = this.ketQuaTests.length;
        const soThanhCong = this.ketQuaTests.filter(k => k.thanhCong).length;
        const soThatBai = tongSoTest - soThanhCong;
        const tyLe = tongSoTest > 0 ? (soThanhCong / tongSoTest) * 100 : 0;

        return {
            tongSoApiTest: tongSoTest,
            soApiThanhCong: soThanhCong,
            soApiThatBai: soThatBai,
            tyLeThanhCong: Math.round(tyLe * 100) / 100,
            diemTongThe: this.tinhDiemTongThe(tyLe),
            danhSachLoi: this.ketQuaTests.filter(k => !k.thanhCong),
            danhSachCanhBao: this.canhBaos,
            thoiGianTongMs: Date.now() - this.thoiGianBatDau,
            timestamp: new Date(),
        };
    }

    // ============================================================
    // IN BÁO CÁO RA CONSOLE
    // ============================================================
    inBaoCao(): void {
        const baoCao = this.taoBaoCao();
        
        console.log('\n');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║           BÁO CÁO TỔNG HỢP E2E TEST - SERVICEOS           ║');
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║   Thời gian: ${baoCao.timestamp.toLocaleString('vi-VN').padEnd(41)}    ║`);
        console.log(`║   Tổng thời gian chạy: ${this.formatTime(baoCao.thoiGianTongMs).padEnd(30)}    ║`);
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║   TỔNG SỐ API TESTED: ${baoCao.tongSoApiTest.toString().padEnd(33)}   ║`);
        console.log(`║   Thành công: ${baoCao.soApiThanhCong.toString().padEnd(41)}   ║`);
        console.log(`║   Thất bại: ${baoCao.soApiThatBai.toString().padEnd(43)}   ║`);
        console.log(`║   Tỷ lệ thành công: ${(baoCao.tyLeThanhCong + '%').padEnd(35)}   ║`);
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log(`║   ĐIỂM TỔNG THỂ: ${baoCao.diemTongThe.padEnd(38)}   ║`);
        console.log('╚══════════════════════════════════════════════════════════════╝');

        // In danh sách lỗi
        if (baoCao.danhSachLoi.length > 0) {
            console.log('\n');
            console.log('┌─────────────────────────────────────────────────────────────┐');
            console.log('│                     DANH SÁCH LỖI                         │');
            console.log('├─────────────────────────────────────────────────────────────┤');
            
            baoCao.danhSachLoi.forEach((loi, index) => {
                console.log(`│ ${index + 1}. [${loi.method}] ${loi.endpoint}`);
                console.log(`│     Test: ${loi.tenTest}`);
                console.log(`│     Loại lỗi: ${loi.loaiLoi || 'UNKNOWN'}`);
                console.log(`│     Chi tiết: ${loi.loiChiTiet || 'Không có thông tin'}`);
                console.log(`│     Status: ${loi.statusCode || 'N/A'}`);
                if (index < baoCao.danhSachLoi.length - 1) {
                    console.log('├─────────────────────────────────────────────────────────────┤');
                }
            });
            
            console.log('└─────────────────────────────────────────────────────────────┘');
        }

        // In danh sách cảnh báo
        if (baoCao.danhSachCanhBao.length > 0) {
            console.log('\n');
            console.log('┌─────────────────────────────────────────────────────────────┐');
            console.log('│               CẢNH BÁO BUSINESS LOGIC                     │');
            console.log('├─────────────────────────────────────────────────────────────┤');
            
            baoCao.danhSachCanhBao.forEach((cb, index) => {
                const muc = cb.mucDoNghiemTrong === 'CAO' ? '🔴' : 
                           cb.mucDoNghiemTrong === 'TRUNG_BÌNH' ? '🟡' : '🟢';
                console.log(`│ ${muc} [${cb.loai}] ${cb.moTa}`);
                if (cb.endpoint) {
                    console.log(`│    Endpoint: ${cb.endpoint}`);
                }
            });
            
            console.log('└─────────────────────────────────────────────────────────────┘');
        }

        // Summary
        console.log('\n');
        if (baoCao.tyLeThanhCong >= 90) {
            console.log('HỆ THỐNG HOẠT ĐỘNG TỐT! Sẵn sàng cho giai đoạn phát triển GUI.');
        } else if (baoCao.tyLeThanhCong >= 75) {
            console.log('HỆ THỐNG CẦN CẢI THIỆN. Vui lòng kiểm tra các lỗi trước khi tiến hành.');
        } else {
            console.log('HỆ THỐNG CÓ NHIỀU LỖI NGHIÊM TRỌNG. Cần sửa chữa ngay lập tức!');
        }
        console.log('\n');
    }

    // ============================================================
    // HELPER: Format thời gian
    // ============================================================
    private formatTime(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    }

    // ============================================================
    // RESET REPORTER
    // ============================================================
    reset(): void {
        this.ketQuaTests = [];
        this.canhBaos = [];
        this.thoiGianBatDau = Date.now();
    }

    // ============================================================
    // LẤY KẾT QUẢ TEST
    // ============================================================
    getKetQua(): KetQuaTest[] {
        return this.ketQuaTests;
    }

    // ============================================================
    // KIỂM TRA CÓ LỖI KHÔNG
    // ============================================================
    hasErrors(): boolean {
        return this.ketQuaTests.some(k => !k.thanhCong);
    }

    // ============================================================
    // LẤY TỶ LỆ THÀNH CÔNG
    // ============================================================
    getTyLeThanhCong(): number {
        const tong = this.ketQuaTests.length;
        if (tong === 0) return 100;
        return (this.ketQuaTests.filter(k => k.thanhCong).length / tong) * 100;
    }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================
export const testReporter = new TestReporter();
