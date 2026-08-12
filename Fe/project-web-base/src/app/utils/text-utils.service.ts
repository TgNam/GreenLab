export class TextUtilsService {
    static formatCurrency(value: number): string {
        return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
    }

    static checkFormatSid(text: string): boolean {
        // 1. Kiểm tra null, undefined hoặc chuỗi rỗng sau khi trim
        if (!text || !text.trim()) {
            return false;
        }
    
        // 2. Định nghĩa Regex
        // ^ : Bắt đầu chuỗi
        // \d{6} : Đúng 6 chữ số
        // - : Dấu gạch ngang
        // \d+ : Một hoặc nhiều chữ số
        // $ : Kết thúc chuỗi
        const regex = /^\d{6}-\d+$/;
    
        // 3. Sử dụng phương thức .test() để kiểm tra
        return regex.test(text);
    };
}