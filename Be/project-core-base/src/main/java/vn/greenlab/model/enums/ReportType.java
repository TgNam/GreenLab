package vn.greenlab.model.enums;

public enum ReportType {
    BASIC("Phiếu kết quả XN chung"), //rptTestResult và rptGetLogo
    BASIC_EN("Phiếu kết quả XN chung (Tiếng Anh)"), //rptTestResult và rptGetLogo
    RECEIPT_A5("Phiếu thu tiền A5"), //rptChiDinh
    RECEIPT_A4("Phiếu thu tiền A4"), //rptBill
    RECEIPT_PARTNER("Phiếu thu tiền cho PK/BS"), //rptBillP
    STATEMENT("Biên bản - Bảng kê Danh sách KH"), //rptStat_PatientDoctor

    STATISTIC_CUSTOMER_1("Thống kê theo KH mẫu 1"), //Chưa rõ
    STATISTIC_CUSTOMER_2("Thống kê theo KH mẫu 2"), //Chưa rõ
    STATISTIC_CUSTOMER_3("Thống kê theo KH mẫu 3"), //Chưa rõ
    STATISTIC_CUSTOMER_4("Thống kê theo KH mẫu 4"), //Chưa rõ

    DOUBLE_TEST("Phiếu kết quả XN Double Test"), //rptDoubleTest
    TRIPLE_TEST("Phiếu kết quả XN Triple Test"), //rptTripleTest
    TSG("Phiếu kết quả XN Tiền sản giật"), //rptTSG
    SLSS("Phiếu kết quả XN Sàng lọc sơ sinh"), //rptSLSS
    GENETIC("Phiếu kết quả XN Di truyền"), //rptGenetics
    GENETIC_25_LAN("Phiếu kết quả 25 bệnh gen lặn"), //rptGenLan
    HBV("Phiếu kết quả xét nghiệm HBV định lượng"), //rptPCR2
    HBV_COBAS("Phiếu kết quả xét nghiệm HBV Cobas"), //rptPCR2
    HPV_COBAS("Phiếu kết quả xét nghiệm HPV Cobas"), //rptPCR_HPV2
    HPV_HIGH_LOW_RISK("Phiếu kết quả xét nghiệm HPV High-Low Risk"), //Chưa rõ
    HPV_24_TYPE("Phiếu kết quả xét nghiệm HPV 24 Type"), //Chưa rõ
    HPV_16_TYPE("Phiếu kết quả xét nghiệm HPV 16 Type"), //Chưa rõ
    HPV_41_TYPE("Phiếu kết quả xét nghiệm HPV 41 Type"), //Chưa rõ
    PCR("Phiếu kết quả xét nghiệm PCR"), //rptPCR2
    THALASAMIA("Phiếu kết quả xét nghiệm Thalasamia"), //Chưa rõ
    PCR_CHL_NGN("Phiếu kết quả xét nghiệm PCR CHL-NGN"), //rptPCR2
    PCR_HLA("Phiếu kết quả xét nghiệm HLA"), //rptPCR2
    HCV("Phiếu kết quả xét nghiệm HCV"), //rptPCR2
    HLA("Phiếu kết quả xét nghiệm HLA"), //rptPCR2
    SAMPLE_COLLECTION_BILL_1("Hóa đơn thu tiền theo danh sách khách hàng"),
    SAMPLE_COLLECTION_BILL_2("Hóa đơn thu tiền theo kết quả xét nghiệm từng khách hàng")
    ;

    private final String name;

    ReportType(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}