import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface BookSeed {
  title: string;
  author: string;
  isbn: string;
}

interface CategorySeed {
  name: string;
  slug: string;
  ddcPrefix: string;
  shelf: string;
  books: BookSeed[];
}

const CATEGORIES: CategorySeed[] = [
  {
    name: "Kinh Thánh",
    slug: "kinh-thanh",
    ddcPrefix: "220",
    shelf: "Kệ KT",
    books: [
      { title: "Kinh Thánh Trọn Bộ - Cựu Ước và Tân Ước", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-01" },
      { title: "Tân Ước", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-02" },
      { title: "Ngũ Thư - Sáng Thế, Xuất Hành, Lêvi, Dân Số, Đệ Nhị Luật", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-03" },
      { title: "Sách Thánh Vịnh", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-04" },
      { title: "Tin Mừng theo Thánh Mátthêu", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-05" },
      { title: "Tin Mừng theo Thánh Máccô", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-06" },
      { title: "Tin Mừng theo Thánh Luca", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-07" },
      { title: "Tin Mừng theo Thánh Gioan", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-08" },
      { title: "Sách Công Vụ Tông Đồ", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-09" },
      { title: "Các Thư của Thánh Phaolô", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-10" },
      { title: "Sách Khải Huyền", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-11" },
      { title: "Sách Châm Ngôn", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-12" },
      { title: "Sách Giảng Viên", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-13" },
      { title: "Diễm Ca", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-14" },
      { title: "Sách Gióp", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-15" },
      { title: "Sách Khôn Ngoan", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-16" },
      { title: "Sách Huấn Ca", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-17" },
      { title: "Các Ngôn Sứ Lớn - Isaia, Giêrêmia, Êdêkien, Đanien", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-18" },
      { title: "Mười Hai Ngôn Sứ Nhỏ", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "KT-19" },
      { title: "Kinh Thánh Cựu Ước và Tân Ước - Bản dịch", author: "Lm. Nguyễn Thế Thuấn", isbn: "KT-20" },
    ],
  },
  {
    name: "Thần học Tín lý",
    slug: "than-hoc-tin-ly",
    ddcPrefix: "230",
    shelf: "Kệ TL",
    books: [
      { title: "Giáo lý Hội Thánh Công giáo", author: "Hội đồng Giám mục Việt Nam", isbn: "TL-01" },
      { title: "Toát Yếu Giáo Lý Của Hội Thánh Công Giáo", author: "Hội đồng Giám mục Việt Nam", isbn: "TL-02" },
      { title: "Nguyên Lý Của Thần Học Công Giáo", author: "Joseph Ratzinger", isbn: "TL-03" },
      { title: "Tự Điển Thần Học Công Giáo", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "TL-04" },
      { title: "Dẫn Vào Thần Học", author: "Lm. Giuse Phan Tấn Thành", isbn: "TL-05" },
      { title: "Đức Kitô Học", author: "Lm. Giuse Phan Tấn Thành", isbn: "TL-06" },
      { title: "Thiên Chúa Ba Ngôi", author: "Lm. Giuse Phan Tấn Thành", isbn: "TL-07" },
      { title: "Hiến Chế Tín Lý Về Giáo Hội - Lumen Gentium", author: "Công đồng Vaticanô II", isbn: "TL-08" },
      { title: "Hiến Chế Tín Lý Về Mặc Khải - Dei Verbum", author: "Công đồng Vaticanô II", isbn: "TL-09" },
      { title: "Hiến Chế Mục Vụ Về Giáo Hội Trong Thế Giới Ngày Nay - Gaudium et Spes", author: "Công đồng Vaticanô II", isbn: "TL-10" },
      { title: "Tổng Luận Thần Học", author: "Thomas Aquinas", isbn: "TL-11" },
      { title: "Thông điệp Đức Tin và Lý Trí - Fides et Ratio", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "TL-12" },
      { title: "Thông điệp Ánh Sáng Đức Tin - Lumen Fidei", author: "Đức Giáo Hoàng Phanxicô", isbn: "TL-13" },
      { title: "Thông điệp Thiên Chúa Là Tình Yêu - Deus Caritas Est", author: "Đức Giáo Hoàng Bênêđictô XVI", isbn: "TL-14" },
      { title: "Thông điệp Được Cứu Rỗi Trong Hy Vọng - Spe Salvi", author: "Đức Giáo Hoàng Bênêđictô XVI", isbn: "TL-15" },
      { title: "Nhân Học Thần Học Công Giáo - Các Mẫu Thức Mạc Khải", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "TL-16" },
      { title: "Con Người Trong Dòng Mạc Khải", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "TL-17" },
      { title: "Thần Học Về Giáo Hội", author: "Lm. Giuse Phan Tấn Thành", isbn: "TL-18" },
      { title: "Đại Cương Thần Học", author: "Lm. Giuse Phan Tấn Thành", isbn: "TL-19" },
      { title: "Hiến Chế Về Phụng Vụ Thánh - Sacrosanctum Concilium", author: "Công đồng Vaticanô II", isbn: "TL-20" },
    ],
  },
  {
    name: "Thần học Luân lý",
    slug: "than-hoc-luan-ly",
    ddcPrefix: "241",
    shelf: "Kệ LL",
    books: [
      { title: "Thông điệp Rạng Ngời Chân Lý - Veritatis Splendor", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "LL-01" },
      { title: "Thông điệp Tin Mừng Sự Sống - Evangelium Vitae", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "LL-02" },
      { title: "Thông điệp Sự Sống Con Người - Humanae Vitae", author: "Đức Giáo Hoàng Phaolô VI", isbn: "LL-03" },
      { title: "Thông điệp Laudato Si' - Chăm Sóc Ngôi Nhà Chung", author: "Đức Giáo Hoàng Phanxicô", isbn: "LL-04" },
      { title: "Thông điệp Fratelli Tutti - Tất Cả Anh Em", author: "Đức Giáo Hoàng Phanxicô", isbn: "LL-05" },
      { title: "Tông huấn Amoris Laetitia - Niềm Vui Yêu Thương", author: "Đức Giáo Hoàng Phanxicô", isbn: "LL-06" },
      { title: "Tông huấn Niềm Vui Của Tin Mừng - Evangelii Gaudium", author: "Đức Giáo Hoàng Phanxicô", isbn: "LL-07" },
      { title: "Tông huấn Hãy Vui Mừng Hoan Hỉ - Gaudete et Exsultate", author: "Đức Giáo Hoàng Phanxicô", isbn: "LL-08" },
      { title: "Thần Học Luân Lý Căn Bản", author: "Lm. Giuse Phan Tấn Thành", isbn: "LL-09" },
      { title: "Thông điệp Bách Chu Niên - Centesimus Annus", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "LL-10" },
      { title: "Thông điệp Quan Tâm Đến Vấn Đề Xã Hội - Sollicitudo Rei Socialis", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "LL-11" },
      { title: "Thông điệp Tân Sự - Rerum Novarum", author: "Đức Giáo Hoàng Lêô XIII", isbn: "LL-12" },
      { title: "Thông điệp Phát Triển Các Dân Tộc - Populorum Progressio", author: "Đức Giáo Hoàng Phaolô VI", isbn: "LL-13" },
      { title: "Thông điệp Tứ Thập Niên - Quadragesimo Anno", author: "Đức Giáo Hoàng Piô XI", isbn: "LL-14" },
      { title: "Toát Yếu Học Thuyết Xã Hội Của Giáo Hội", author: "Hội đồng Giáo hoàng Công lý và Hòa bình", isbn: "LL-15" },
      { title: "Lương Tâm Và Luân Lý Kitô Giáo", author: "Lm. Giuse Phan Tấn Thành", isbn: "LL-16" },
      { title: "Đạo Đức Sinh Học Công Giáo", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "LL-17" },
      { title: "Tông huấn Familiaris Consortio - Gia Đình Kitô Hữu", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "LL-18" },
      { title: "Thông điệp Chân Lý Trong Bác Ái - Caritas in Veritate", author: "Đức Giáo Hoàng Bênêđictô XVI", isbn: "LL-19" },
      { title: "Tông huấn hậu thượng hội đồng - Đức Kitô hằng sống - Christus Vivit", author: "Đức Giáo Hoàng Phanxicô", isbn: "LL-20" },
    ],
  },
  {
    name: "Giáo lý",
    slug: "giao-ly",
    ddcPrefix: "268",
    shelf: "Kệ GL",
    books: [
      { title: "Sách Giáo Lý Của Hội Thánh Công Giáo", author: "Hội đồng Giám mục Việt Nam", isbn: "GL-01" },
      { title: "Toát Yếu Giáo Lý Của Hội Thánh Công Giáo", author: "Hội đồng Giám mục Việt Nam", isbn: "GL-02" },
      { title: "YOUCAT - Giáo Lý Cho Người Trẻ", author: "Hội đồng Giáo hoàng về Cổ vũ Tân Phúc Âm hóa", isbn: "GL-03" },
      { title: "DOCAT - Giáo Huấn Xã Hội Công Giáo Cho Người Trẻ", author: "Hội đồng Giáo hoàng về Cổ vũ Tân Phúc Âm hóa", isbn: "GL-04" },
      { title: "Giáo Lý Hôn Nhân", author: "Ủy ban Mục vụ Gia đình - HĐGM Việt Nam", isbn: "GL-05" },
      { title: "Giáo Lý Dự Tòng", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-06" },
      { title: "Giáo Lý Cấp I - Đến Bàn Tiệc Thánh", author: "Giáo phận Hưng Hóa", isbn: "GL-07" },
      { title: "Tìm Hiểu Sách Giáo Lý Hội Thánh Công Giáo - Phần I: Tuyên Xưng Đức Tin", author: "Giáo phận Bà Rịa", isbn: "GL-08" },
      { title: "Tìm Hiểu Sách Giáo Lý Hội Thánh Công Giáo - Phần II: Các Bí Tích", author: "Tổng Giáo phận Sài Gòn", isbn: "GL-09" },
      { title: "100 Câu Hỏi Đáp Về Giáo Lý Công Giáo", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-10" },
      { title: "Giáo Lý Thêm Sức", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-11" },
      { title: "Giáo Lý Rước Lễ Lần Đầu", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-12" },
      { title: "Sách Bổn", author: "Hội Thánh Công Giáo Việt Nam", isbn: "GL-13" },
      { title: "Giáo Lý Cho Người Trưởng Thành", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-14" },
      { title: "Sổ Tay Giáo Lý Viên", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-15" },
      { title: "Tất Cả Các Kinh", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-16" },
      { title: "Giáo Lý Về Mười Điều Răn", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-17" },
      { title: "Giáo Lý Về Kinh Lạy Cha", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-18" },
      { title: "Giáo Lý Về Tám Mối Phúc Thật", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-19" },
      { title: "Toàn Cầu Hóa Và Giáo Lý", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "GL-20" },
    ],
  },
  {
    name: "Linh đạo & Tu đức",
    slug: "linh-dao-tu-duc",
    ddcPrefix: "248",
    shelf: "Kệ LD",
    books: [
      { title: "Gương Chúa Giêsu", author: "Thomas à Kempis", isbn: "LD-01" },
      { title: "Chuyện Một Tâm Hồn", author: "Thánh Têrêsa Hài Đồng Giêsu", isbn: "LD-02" },
      { title: "Lâu Đài Nội Tâm", author: "Thánh Têrêsa Avila", isbn: "LD-03" },
      { title: "Đêm Tối Tăm Của Linh Hồn", author: "Thánh Gioan Thánh Giá", isbn: "LD-04" },
      { title: "Đường Lên Núi Cát Minh", author: "Thánh Gioan Thánh Giá", isbn: "LD-05" },
      { title: "Tự Thuật", author: "Thánh Augustinô", isbn: "LD-06" },
      { title: "Dẫn Vào Đời Sống Đạo Đức", author: "Thánh Phanxicô Đờ Salê", isbn: "LD-07" },
      { title: "Linh Thao", author: "Thánh Ignatiô Loyola", isbn: "LD-08" },
      { title: "Nhật Ký Lòng Chúa Thương Xót", author: "Thánh Faustina Kowalska", isbn: "LD-09" },
      { title: "Bông Hoa Nhỏ", author: "Thánh Têrêsa Hài Đồng Giêsu", isbn: "LD-10" },
      { title: "Hành Trình Nội Tâm", author: "Thánh Têrêsa Avila", isbn: "LD-11" },
      { title: "Con Đường Thơ Ấu Thiêng Liêng", author: "Thánh Têrêsa Hài Đồng Giêsu", isbn: "LD-12" },
      { title: "Vinh Quang Đức Maria", author: "Thánh Anphongsô Ligôri", isbn: "LD-13" },
      { title: "Phương Pháp Cầu Nguyện", author: "Thánh Anphongsô Ligôri", isbn: "LD-14" },
      { title: "Nói Chuyện Với Chúa", author: "Thánh Josemaría Escrivá", isbn: "LD-15" },
      { title: "Đường", author: "Thánh Josemaría Escrivá", isbn: "LD-16" },
      { title: "Hãy Chỗi Dậy Từ Bóng Tối", author: "Benedict J. Groeschel", isbn: "LD-17" },
      { title: "Hy Vọng", author: "Đức Giáo Hoàng Phanxicô", isbn: "LD-18" },
      { title: "Bảy Mối Tội Đầu Và Đời Sống Thiêng Liêng", author: "Thánh Anphongsô Ligôri", isbn: "LD-19" },
      { title: "Cầu Nguyện Chiêm Niệm", author: "Thánh Têrêsa Avila", isbn: "LD-20" },
    ],
  },
  {
    name: "Phụng vụ & Bí tích",
    slug: "phung-vu-bi-tich",
    ddcPrefix: "264",
    shelf: "Kệ PV",
    books: [
      { title: "Các Nguyên Tắc Căn Bản Về Phụng Vụ", author: "Lm. Vinh Sơn Nguyễn Thế Thủ", isbn: "PV-01" },
      { title: "Phụng Vụ Các Bí Tích", author: "Lm. Vinh Sơn Nguyễn Thế Thủ", isbn: "PV-02" },
      { title: "Cẩm Nang Các Nghi Thức Bí Tích Và Á Bí Tích", author: "Lm. Vinh Sơn Nguyễn Thế Thủ", isbn: "PV-03" },
      { title: "Hiến Chế Về Phụng Vụ Thánh - Sacrosanctum Concilium", author: "Công đồng Vaticanô II", isbn: "PV-04" },
      { title: "Sách Lễ Rôma", author: "Hội đồng Giám mục Việt Nam", isbn: "PV-05" },
      { title: "Sách Các Giờ Kinh Phụng Vụ", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "PV-06" },
      { title: "Nghi Thức Thánh Lễ", author: "Ủy ban Phụng tự - HĐGM Việt Nam", isbn: "PV-07" },
      { title: "Nghi Thức Rửa Tội Trẻ Em", author: "Ủy ban Phụng tự - HĐGM Việt Nam", isbn: "PV-08" },
      { title: "Nghi Thức Hôn Phối", author: "Ủy ban Phụng tự - HĐGM Việt Nam", isbn: "PV-09" },
      { title: "Nghi Thức An Táng", author: "Ủy ban Phụng tự - HĐGM Việt Nam", isbn: "PV-10" },
      { title: "Năm Phụng Vụ Và Các Thánh", author: "Ủy ban Phụng tự - HĐGM Việt Nam", isbn: "PV-11" },
      { title: "Ý Nghĩa Thánh Lễ", author: "Lm. Vinh Sơn Nguyễn Thế Thủ", isbn: "PV-12" },
      { title: "Bảy Bí Tích Trong Đời Sống Giáo Hội", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "PV-13" },
      { title: "Bí Tích Thánh Thể", author: "Lm. Giuse Phan Tấn Thành", isbn: "PV-14" },
      { title: "Bí Tích Hòa Giải", author: "Lm. Giuse Phan Tấn Thành", isbn: "PV-15" },
      { title: "Hướng Dẫn Giảng Thuyết", author: "Bộ Phụng tự và Kỷ luật các Bí tích", isbn: "PV-16" },
      { title: "Quy Luật Phụng Vụ Và Vẻ Đẹp Phượng Thờ", author: "Giáo phận Đà Lạt", isbn: "PV-17" },
      { title: "Giáo Trình Phụng Vụ", author: "Lm. Vinh Sơn Nguyễn Thế Thủ", isbn: "PV-18" },
      { title: "Phụng Vụ Giờ Kinh", author: "Nhóm Phiên Dịch Các Giờ Kinh Phụng Vụ", isbn: "PV-19" },
      { title: "Lịch Phụng Vụ Công Giáo", author: "Hội đồng Giám mục Việt Nam", isbn: "PV-20" },
    ],
  },
  {
    name: "Lịch sử Giáo hội",
    slug: "lich-su-giao-hoi",
    ddcPrefix: "270",
    shelf: "Kệ LS",
    books: [
      { title: "Lịch sử Giáo hội Công giáo Việt Nam", author: "Phan Phát Huồn", isbn: "LS-01" },
      { title: "Tản Mạn Lịch Sử Giáo Hội Công Giáo Việt Nam", author: "Đỗ Quang Chính", isbn: "LS-02" },
      { title: "Lược Sử Giáo Hội Việt Nam", author: "Augustino Nguyễn Văn Trinh", isbn: "LS-03" },
      { title: "Lược Sử Hội Thánh Công Giáo Tại Việt Nam", author: "Hội Dòng Mến Thánh Giá Gò Vấp", isbn: "LS-04" },
      { title: "Lịch Sử Các Năm Thánh Trong Dòng Lịch Sử Giáo Hội Công Giáo Rôma", author: "Lm. Phêrô Nguyễn Thanh Tùng", isbn: "LS-05" },
      { title: "Lịch Sử Giáo Hội Công Giáo", author: "Lm. Đào Trung Hiệu", isbn: "LS-06" },
      { title: "Các Thánh Tử Đạo Việt Nam", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "LS-07" },
      { title: "Dòng Máu Anh Hùng - 117 Thánh Tử Đạo Việt Nam", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "LS-08" },
      { title: "Lịch Sử Truyền Giáo Tại Việt Nam", author: "Nguyễn Hồng", isbn: "LS-09" },
      { title: "Lịch Sử Công Đồng Vaticanô II", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "LS-10" },
      { title: "Lịch Sử Các Đức Giáo Hoàng", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "LS-11" },
      { title: "Lịch Sử Dòng Tên Tại Việt Nam", author: "Dòng Tên Việt Nam", isbn: "LS-12" },
      { title: "Lịch Sử Dòng Đa Minh", author: "Dòng Đa Minh Việt Nam", isbn: "LS-13" },
      { title: "Alexandre de Rhodes Và Chữ Quốc Ngữ", author: "Đỗ Quang Chính", isbn: "LS-14" },
      { title: "Các Thừa Sai Pháp Tại Việt Nam", author: "Nguyễn Hồng", isbn: "LS-15" },
      { title: "Giáo Hội Công Giáo Thời Sơ Khai", author: "Lm. Đào Trung Hiệu", isbn: "LS-16" },
      { title: "Lịch Sử Ly Giáo Đông Tây", author: "Lm. Đào Trung Hiệu", isbn: "LS-17" },
      { title: "Lịch Sử Cải Cách Tin Lành Và Công Đồng Trentô", author: "Lm. Đào Trung Hiệu", isbn: "LS-18" },
      { title: "Đại Cương Lịch Sử Giáo Hội Công Giáo", author: "Lm. Đào Trung Hiệu", isbn: "LS-19" },
      { title: "Thánh Anrê Phú Yên", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "LS-20" },
    ],
  },
  {
    name: "Triết học",
    slug: "triet-hoc",
    ddcPrefix: "100",
    shelf: "Kệ TH",
    books: [
      { title: "Siêu Hình Học", author: "Aristotle", isbn: "TH-01" },
      { title: "Đạo Đức Học Nicomachus", author: "Aristotle", isbn: "TH-02" },
      { title: "Cộng Hòa", author: "Plato", isbn: "TH-03" },
      { title: "Suy Niệm Về Đệ Nhất Triết Học", author: "René Descartes", isbn: "TH-04" },
      { title: "Phê Phán Lý Tính Thuần Túy", author: "Immanuel Kant", isbn: "TH-05" },
      { title: "Thành Đô Thiên Chúa", author: "Thánh Augustinô", isbn: "TH-06" },
      { title: "Dẫn Vào Triết Học", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-07" },
      { title: "Lịch Sử Triết Học Tây Phương", author: "Ủy ban Giáo lý Đức tin - HĐGM Việt Nam", isbn: "TH-08" },
      { title: "Nhân Sinh Quan Của Dostoevsky", author: "Nikolai Alexandrovitch Berdyaev", isbn: "TH-09" },
      { title: "Triết Học Hiện Sinh", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-10" },
      { title: "Siêu Hình Học Về Hữu Thể", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-11" },
      { title: "Nhận Thức Luận", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-12" },
      { title: "Luận Lý Học Hình Thức", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-13" },
      { title: "Triết Học Nhân Bản", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-14" },
      { title: "Triết Học Cổ Đại Hy Lạp", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-15" },
      { title: "Triết Học Trung Cổ", author: "Lm. Giuse Phan Tấn Thành", isbn: "TH-16" },
      { title: "Đạo Đức Kinh", author: "Lão Tử", isbn: "TH-17" },
      { title: "Lão Tử Tinh Hoa", author: "Thu Giang Nguyễn Duy Cần", isbn: "TH-18" },
      { title: "Tổng Luận Thần Học", author: "Thomas Aquinas", isbn: "TH-19" },
      { title: "Đại Cương Lịch Sử Triết Học Trung Hoa", author: "Thu Giang Nguyễn Duy Cần", isbn: "TH-20" },
    ],
  },
  {
    name: "Giáo luật & Mục vụ",
    slug: "giao-luat-muc-vu",
    ddcPrefix: "262",
    shelf: "Kệ GM",
    books: [
      { title: "Bộ Giáo Luật 1983", author: "Hội đồng Giám mục Việt Nam", isbn: "GM-01" },
      { title: "Giải Thích Bộ Giáo Luật - Quyển IV: Nhiệm Vụ Thánh Hóa Của Giáo Hội", author: "Lm. Giacôbê Phạm Văn Phượng", isbn: "GM-02" },
      { title: "Giải Thích Giáo Luật - Dân Thiên Chúa", author: "Lm. Giuse Phan Tấn Thành", isbn: "GM-03" },
      { title: "Giáo Luật Công Giáo", author: "Lm. Giuse Phan Tấn Thành", isbn: "GM-04" },
      { title: "Mục Vụ Giáo Xứ", author: "Ủy ban Giáo sĩ - HĐGM Việt Nam", isbn: "GM-05" },
      { title: "Cẩm Nang Mục Vụ Linh Mục", author: "Ủy ban Giáo sĩ - HĐGM Việt Nam", isbn: "GM-06" },
      { title: "Mục Vụ Gia Đình", author: "Ủy ban Mục vụ Gia đình - HĐGM Việt Nam", isbn: "GM-07" },
      { title: "Mục Vụ Giới Trẻ", author: "Ủy ban Mục vụ Giới trẻ - HĐGM Việt Nam", isbn: "GM-08" },
      { title: "Mục Vụ Ơn Gọi", author: "Ủy ban Ơn gọi - HĐGM Việt Nam", isbn: "GM-09" },
      { title: "Đào Tạo Linh Mục", author: "Ủy ban Giáo sĩ - HĐGM Việt Nam", isbn: "GM-10" },
      { title: "Đời Sống Thánh Hiến", author: "Ủy ban Tu sĩ - HĐGM Việt Nam", isbn: "GM-11" },
      { title: "Giáo Luật Về Hôn Nhân", author: "Lm. Giuse Phan Tấn Thành", isbn: "GM-12" },
      { title: "Giáo Luật Về Dòng Tu", author: "Lm. Giuse Phan Tấn Thành", isbn: "GM-13" },
      { title: "Quản Trị Giáo Xứ", author: "Ủy ban Giáo sĩ - HĐGM Việt Nam", isbn: "GM-14" },
      { title: "Sổ Tay Mục Vụ Bệnh Nhân", author: "Ủy ban Mục vụ Sức khỏe - HĐGM Việt Nam", isbn: "GM-15" },
      { title: "Tông huấn Pastores Dabo Vobis - Ta Sẽ Ban Cho Các Ngươi Những Mục Tử", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "GM-16" },
      { title: "Tông huấn Vita Consecrata - Đời Sống Thánh Hiến", author: "Thánh Giáo Hoàng Gioan Phaolô II", isbn: "GM-17" },
      { title: "Kim Chỉ Nam Cho Các Linh Mục", author: "Bộ Giáo Sĩ", isbn: "GM-18" },
      { title: "Huấn Thị Về Đào Tạo Linh Mục", author: "Bộ Giáo Sĩ", isbn: "GM-19" },
      { title: "Mục Vụ Truyền Thông", author: "Ủy ban Truyền thông Xã hội - HĐGM Việt Nam", isbn: "GM-20" },
    ],
  },
  {
    name: "Hạnh các Thánh & Văn học Công giáo",
    slug: "hanh-cac-thanh-van-hoc",
    ddcPrefix: "282",
    shelf: "Kệ HT",
    books: [
      { title: "Hạnh Các Thánh", author: "Alban Butler", isbn: "HT-01" },
      { title: "Hạnh Thánh Antôn Padua", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-02" },
      { title: "Hạnh Thánh Phanxicô Assisi", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-03" },
      { title: "Hạnh Thánh Đa Minh", author: "Dòng Đa Minh Việt Nam", isbn: "HT-04" },
      { title: "Hạnh Thánh Vinh Sơn Phaolô", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-05" },
      { title: "Hạnh Thánh Têrêsa Hài Đồng Giêsu", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-06" },
      { title: "Hạnh Thánh Gioan Vianney", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-07" },
      { title: "Hạnh Thánh Maximilian Kolbe", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-08" },
      { title: "Hạnh Thánh Gioan Phaolô II", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-09" },
      { title: "Hạnh Thánh Mẹ Têrêsa Calcutta", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-10" },
      { title: "117 Thánh Tử Đạo Việt Nam", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-11" },
      { title: "Thánh Anrê Phú Yên", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-12" },
      { title: "Đức Mẹ Hằng Cứu Giúp", author: "Dòng Chúa Cứu Thế Việt Nam", isbn: "HT-13" },
      { title: "Đức Mẹ La Vang", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-14" },
      { title: "Đức Mẹ Fatima", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-15" },
      { title: "Đức Mẹ Lộ Đức", author: "Ủy ban Văn hóa - HĐGM Việt Nam", isbn: "HT-16" },
      { title: "Thần Khúc", author: "Dante Alighieri", isbn: "HT-17" },
      { title: "Anh Em Nhà Karamazov", author: "Fyodor Dostoevsky", isbn: "HT-18" },
      { title: "Thằng Gù Nhà Thờ Đức Bà", author: "Victor Hugo", isbn: "HT-19" },
      { title: "Nhật Ký Của Một Linh Mục Quê", author: "Georges Bernanos", isbn: "HT-20" },
    ],
  },
];

async function main() {
  let totalBooks = 0;
  let totalCopies = 0;
  let globalIndex = 0;

  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { ddcPrefix: cat.ddcPrefix },
      create: { name: cat.name, slug: cat.slug, ddcPrefix: cat.ddcPrefix },
    });

    for (const b of cat.books) {
      globalIndex += 1;
      const author = await prisma.author.upsert({
        where: { name: b.author },
        update: {},
        create: { name: b.author },
      });

      const book = await prisma.book.upsert({
        where: { isbn: b.isbn },
        update: {
          title: b.title,
          authorId: author.id,
          categoryId: category.id,
        },
        create: {
          title: b.title,
          authorId: author.id,
          categoryId: category.id,
          isbn: b.isbn,
          language: "Tiếng Việt",
        },
      });
      totalBooks += 1;

      const copyCount = (globalIndex % 3) + 1; // 1, 2 hoặc 3 bản/sách, xoay vòng cho đa dạng
      for (let i = 1; i <= copyCount; i++) {
        const barcode = `${book.id.slice(-6).toUpperCase()}-${i}`;
        await prisma.bookCopy.upsert({
          where: { barcode },
          update: {},
          create: { bookId: book.id, barcode, location: cat.shelf },
        });
        totalCopies += 1;
      }
    }
  }

  console.log("Tạo lại dữ liệu thư viện Công giáo hoàn tất:");
  console.log(`- ${CATEGORIES.length} thể loại`);
  console.log(`- ${totalBooks} sách`);
  console.log(`- ${totalCopies} bản sao`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
