from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, HRFlowable
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "huong-dan-test-api-bang-postman.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

BLUE = colors.HexColor("#155EEF")
NAVY = colors.HexColor("#102A43")
CYAN = colors.HexColor("#E9F2FF")
GREEN = colors.HexColor("#087A55")
GREEN_BG = colors.HexColor("#E8F7F0")
ORANGE = colors.HexColor("#B54708")
ORANGE_BG = colors.HexColor("#FFF3E0")
RED = colors.HexColor("#B42318")
RED_BG = colors.HexColor("#FDECEC")
GRAY = colors.HexColor("#52606D")
LIGHT = colors.HexColor("#F5F7FA")
BORDER = colors.HexColor("#D9E2EC")

pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", r"C:\Windows\Fonts\ariali.ttf"))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="BodyVN", fontName="Arial", fontSize=10, leading=15, textColor=NAVY, spaceAfter=6))
styles.add(ParagraphStyle(name="SmallVN", fontName="Arial", fontSize=8.5, leading=12, textColor=GRAY))
styles.add(ParagraphStyle(name="H1VN", fontName="Arial-Bold", fontSize=22, leading=27, textColor=NAVY, spaceAfter=9))
styles.add(ParagraphStyle(name="H2VN", fontName="Arial-Bold", fontSize=16, leading=21, textColor=BLUE, spaceBefore=4, spaceAfter=8))
styles.add(ParagraphStyle(name="H3VN", fontName="Arial-Bold", fontSize=11.5, leading=15, textColor=NAVY, spaceBefore=7, spaceAfter=4))
styles.add(ParagraphStyle(name="CodeVN", fontName="Arial", fontSize=8.2, leading=11.5, textColor=colors.HexColor("#E6EDF3"), backColor=colors.HexColor("#172B4D"), borderPadding=7, spaceBefore=3, spaceAfter=7))
styles.add(ParagraphStyle(name="Step", fontName="Arial-Bold", fontSize=10.5, leading=14, textColor=BLUE, spaceBefore=5, spaceAfter=3))
styles.add(ParagraphStyle(name="Cover", fontName="Arial-Bold", fontSize=29, leading=35, textColor=colors.white, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="CoverSub", fontName="Arial", fontSize=14, leading=20, textColor=colors.HexColor("#DCE9FF")))
styles.add(ParagraphStyle(name="TOC", fontName="Arial", fontSize=10.5, leading=16, textColor=NAVY))
styles.add(ParagraphStyle(name="Table", fontName="Arial", fontSize=8.3, leading=11, textColor=NAVY))
styles.add(ParagraphStyle(name="TableHead", fontName="Arial-Bold", fontSize=8.5, leading=11, textColor=colors.white))


def P(text, style="BodyVN"):
    return Paragraph(text, styles[style])


def code(text):
    return P(text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>"), "CodeVN")


def box(title, body, kind="info"):
    palette = {
        "info": (BLUE, CYAN), "ok": (GREEN, GREEN_BG),
        "warn": (ORANGE, ORANGE_BG), "error": (RED, RED_BG),
    }
    fg, bg = palette[kind]
    t = Table([[P(title, "H3VN")], [P(body)]], colWidths=[166*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("BOX", (0, 0), (-1, -1), 0.8, fg),
        ("LINEBEFORE", (0, 0), (0, -1), 4, fg), ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def api_table(rows):
    data = [[P("Thao tác", "TableHead"), P("Method + URL", "TableHead"), P("Mục đích", "TableHead")]]
    data += [[P(a, "Table"), P(b, "Table"), P(c, "Table")] for a, b, c in rows]
    t = Table(data, colWidths=[30*mm, 72*mm, 64*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE), ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setStrokeColor(BORDER)
        canvas.line(22*mm, 284*mm, 188*mm, 284*mm)
        canvas.setFont("Arial", 8)
        canvas.setFillColor(GRAY)
        canvas.drawString(22*mm, 288*mm, "HƯỚNG DẪN TEST API BẰNG POSTMAN")
        canvas.drawRightString(188*mm, 12*mm, f"Trang {doc.page}")
        canvas.drawString(22*mm, 12*mm, "Cellphone Store API - Tài liệu dành cho tester")
    canvas.restoreState()


doc = BaseDocTemplate(str(OUT), pagesize=A4, rightMargin=22*mm, leftMargin=22*mm, topMargin=18*mm, bottomMargin=18*mm,
                      title="Hướng dẫn test API bằng Postman", author="Codex - dựa trên README dự án")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates(PageTemplate(id="main", frames=frame, onPage=header_footer))

story = []

# Cover
cover = Table([[P("HƯỚNG DẪN<br/>TEST API BẰNG POSTMAN", "Cover")],
               [Spacer(1, 8*mm)],
               [P("Dành cho tester mới bắt đầu - không cần biết lập trình", "CoverSub")],
               [Spacer(1, 60*mm)],
               [P("SERVER API QUẢN LÝ CỬA HÀNG ĐIỆN THOẠI", "CoverSub")],
               [P("Production: thaotesting-git-main-minhdubai.vercel.app", "CoverSub")],
               [Spacer(1, 10*mm)],
               [P("Phiên bản tài liệu: 11/07/2026", "CoverSub")]], colWidths=[166*mm], rowHeights=[42*mm, 8*mm, 20*mm, 60*mm, 12*mm, 12*mm, 10*mm, 12*mm])
cover.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NAVY), ("LEFTPADDING", (0, 0), (-1, -1), 14*mm),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 12*mm), ("TOPPADDING", (0, 0), (-1, -1), 8*mm),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 3*mm)]))
story += [cover, PageBreak()]

story += [P("Bạn sẽ làm được gì sau tài liệu này?", "H1VN"),
          P("Bạn sẽ tự gửi request tới server, đăng nhập, dùng token, kiểm tra dữ liệu, tạo dữ liệu thử và nhận biết lỗi mà không cần viết code."),
          box("Nguyên tắc an toàn", "Đây là server production dùng chung. Chỉ tạo dữ liệu có tiền tố <b>TEST_</b>, ghi lại ID đã tạo, không xóa hoặc sửa dữ liệu của người khác. API xóa sản phẩm thực tế chỉ đánh dấu sản phẩm không còn hoạt động.", "warn"),
          Spacer(1, 5*mm), P("Mục lục", "H2VN")]
for item in ["1. API và Postman là gì?", "2. Chuẩn bị Postman và Environment", "3. Bài 1 - Kiểm tra server", "4. Bài 2 - Đăng nhập và lưu token", "5. Bài 3 - Gọi API cần đăng nhập", "6. Bài 4 - Xem và tạo dữ liệu", "7. Bài 5 - Tạo đơn hàng", "8. Kiểm thử lỗi và quyền", "9. Danh mục API", "10. Checklist báo lỗi"]:
    story.append(P(item, "TOC"))
story += [Spacer(1, 6*mm), box("Cách đọc nhanh", "Làm lần lượt các bài 1 đến 5. Mỗi bài đều có: thao tác trong Postman, dữ liệu mẫu, kết quả mong đợi và lỗi thường gặp.", "ok"), PageBreak()]

story += [P("1. Hiểu nhanh: API và Postman", "H1VN"),
          P("<b>API</b> giống như quầy tiếp nhận yêu cầu. Bạn gửi một yêu cầu (request), server xử lý rồi trả kết quả (response). <b>Postman</b> là công cụ giúp bạn tạo và gửi yêu cầu đó bằng giao diện."),
          P("Bốn phần cần nhớ", "H2VN"),
          api_table([
              ("Method", "GET / POST / PATCH / DELETE", "Hành động: xem, tạo, sửa hoặc xóa."),
              ("URL", "{{baseUrl}}/api/products", "Địa chỉ nơi nhận request."),
              ("Headers", "Authorization, Content-Type", "Thông tin đi kèm, như vé đăng nhập."),
              ("Body", "JSON", "Dữ liệu gửi lên khi tạo hoặc sửa."),
          ]), Spacer(1, 5*mm),
          P("Ý nghĩa Method", "H2VN"),
          P("<b>GET</b>: lấy/xem dữ liệu. <b>POST</b>: tạo mới hoặc đăng nhập. <b>PATCH</b>: sửa một phần dữ liệu. <b>DELETE</b>: xóa hoặc vô hiệu hóa."),
          box("Kết quả quan trọng nhất", "Nhìn vào <b>Status</b> và phần JSON trong <b>Body</b>. Status 2xx thường là thành công; 4xx thường là request hoặc quyền có vấn đề; 5xx thường là lỗi phía server.", "info"),
          P("Cấu trúc response chung", "H2VN"),
          code('{\n  "success": true,\n  "message": "Product created",\n  "data": { "product": {} }\n}'), PageBreak()]

story += [P("2. Chuẩn bị Postman", "H1VN"),
          P("Cài và mở Postman. Bạn có thể dùng bản desktop hoặc web. Tạo một Collection mới tên <b>Cellphone Store API</b>."),
          P("Tạo Environment", "H2VN"),
          P("1. Chọn <b>Environments</b> ở thanh bên trái, bấm dấu <b>+</b>."),
          P("2. Đặt tên: <b>Cellphone Store - Production</b>."),
          P("3. Thêm hai biến dưới đây. Với token, để trống lúc đầu."),
          api_table([
              ("baseUrl", "https://thaotesting-git-main-minhdubai.vercel.app", "Địa chỉ server production."),
              ("token", "để trống", "JWT nhận được sau khi login."),
          ]),
          P("4. Bấm <b>Save</b>, rồi chọn environment này ở góc trên bên phải."),
          box("Dấu hiệu làm đúng", "Khi rê chuột lên <b>{{baseUrl}}</b> trong URL request, Postman hiển thị địa chỉ production. Nếu biến có màu đỏ hoặc không có giá trị, hãy kiểm tra đã Save và chọn đúng Environment chưa.", "ok"),
          P("Thiết lập request JSON", "H2VN"),
          P("Với POST/PATCH: mở tab <b>Body</b> → chọn <b>raw</b> → chọn <b>JSON</b>. Postman sẽ tự thêm header <b>Content-Type: application/json</b>."),
          box("Không chia sẻ token", "Token tương đương vé đăng nhập. Không chụp màn hình hoặc gửi token lên nhóm công khai. Nếu token hết hạn, đăng nhập lại và thay giá trị token.", "warn"), PageBreak()]

story += [P("3. Bài 1 - Kiểm tra server", "H1VN"),
          P("Mục tiêu: xác nhận server đang phản hồi trước khi test các chức năng khác."),
          P("Thao tác", "H2VN"),
          P("1. Trong Collection, bấm <b>Add request</b>, đặt tên <b>01 - Health check</b>."),
          P("2. Chọn Method <b>GET</b>."),
          P("3. Nhập URL rồi bấm <b>Send</b>:"), code("{{baseUrl}}/health"),
          P("Kết quả mong đợi", "H2VN"),
          P("Status thuộc nhóm 2xx và response cho biết server đang hoạt động. Request này không cần token và không có Body."),
          box("Nếu không gọi được", "Kiểm tra Internet, URL không có dấu cách, đã chọn đúng Environment và biến baseUrl có giá trị. Nếu thấy 404, kiểm tra đường dẫn chính xác là <b>/health</b>, không phải <b>/api/health</b>.", "error"),
          P("Ghi nhận bằng chứng", "H2VN"),
          P("Chụp màn hình gồm Method, URL, Status, thời gian phản hồi và Body. Ghi thời điểm test vì lỗi kết nối có thể chỉ xảy ra tạm thời."), PageBreak()]

story += [P("4. Bài 2 - Đăng nhập và lưu token", "H1VN"),
          P("Dùng tài khoản mẫu đã được seed. Theo README, mật khẩu mặc định của các user mẫu là <b>secret123</b>. Email cụ thể cần lấy từ người quản trị dữ liệu test hoặc Swagger/dữ liệu seed."),
          P("Tạo request Login", "H2VN"),
          P("Method: <b>POST</b>"), code("{{baseUrl}}/api/login"),
          P("Body → raw → JSON:"), code('{\n  "email": "EMAIL_TAI_KHOAN_TEST",\n  "password": "secret123"\n}'),
          P("Bấm <b>Send</b>. Response thành công có <b>success: true</b> và chứa JWT. Tên trường token có thể xem trực tiếp trong <b>data</b> của response."),
          P("Lưu token - cách dễ nhất", "H2VN"),
          P("Copy chuỗi token (không copy dấu ngoặc kép) → mở Environment → dán vào giá trị biến <b>token</b> → Save."),
          P("Lưu token tự động - tùy chọn", "H2VN"),
          P("Trong tab <b>Scripts → Post-response</b>, dùng đoạn sau. Script thử các vị trí phổ biến của token:"),
          code('const json = pm.response.json();\nconst token = json.data?.token || json.data?.accessToken || json.token;\nif (token) pm.environment.set("token", token);'),
          box("Kiểm tra", "Sau khi Send, mở Environment và xác nhận biến token đã có chuỗi dài. Nếu chưa có, xem response để xác định đúng tên trường rồi copy thủ công.", "ok"), PageBreak()]

story += [P("5. Bài 3 - Gọi API cần đăng nhập", "H1VN"),
          P("Mục tiêu: kiểm tra token hoạt động và xem thông tin tài khoản hiện tại."),
          P("Tạo request GET /api/me", "H2VN"), code("{{baseUrl}}/api/me"),
          P("Mở tab <b>Authorization</b> → Type: <b>Bearer Token</b> → Token: <b>{{token}}</b> → Send."),
          P("Kết quả mong đợi", "H2VN"),
          P("Status 2xx; response cho biết user đang đăng nhập. Kiểm tra email và roles có đúng với tài khoản test."),
          P("Áp dụng token cho cả Collection", "H2VN"),
          P("Mở Collection → <b>Authorization</b> → chọn <b>Bearer Token</b> → nhập <b>{{token}}</b> → Save. Các request con chọn <b>Inherit auth from parent</b>."),
          box("Lỗi 401", "Thường do thiếu token, token bị copy thừa dấu ngoặc kép/khoảng trắng, token hết hạn hoặc dùng sai Environment. Login lại, lưu token mới và thử lại.", "error"),
          box("Lỗi 403", "Bạn đã đăng nhập nhưng vai trò không có quyền thực hiện hành động. Đây khác với 401. Hãy ghi lại role, Method, URL và response để báo lỗi hoặc xác nhận đúng phân quyền.", "warn"),
          P("Bài kiểm tra nhanh", "H2VN"),
          P("Gửi cùng request ba lần: có token hợp lệ, bỏ token, và thay token bằng chữ <b>abc</b>. Kỳ vọng lần đầu thành công; hai lần sau bị từ chối."), PageBreak()]

story += [P("6. Bài 4 - Xem và tạo dữ liệu", "H1VN"),
          P("Bắt đầu bằng GET để lấy ID thật, sau đó mới POST/PATCH. Không tự chế UUID vì các quan hệ phải tồn tại."),
          P("Xem danh sách sản phẩm", "H2VN"), code("GET {{baseUrl}}/api/products"),
          P("Authorization kế thừa từ Collection. Không có Body. Kiểm tra success, danh sách sản phẩm và các trường như id, sku, name, price, unitsInStock, isActive."),
          P("Tạo khách hàng test", "H2VN"), code("POST {{baseUrl}}/api/customers"),
          P("Body:"), code('{\n  "name": "TEST_Nguyen Van A",\n  "phone": "0900000001",\n  "email": "test.nguyenvana@example.com",\n  "address": "123 Duong Test, TP HCM"\n}'),
          P("Sau khi thành công, copy <b>id</b> của customer từ response. Tạo biến Environment tên <b>customerId</b> để dùng lại."),
          P("Sửa khách hàng", "H2VN"), code("PATCH {{baseUrl}}/api/customers/{{customerId}}"),
          P("Body:"), code('{\n  "phone": "0900000099",\n  "address": "456 Duong Test Moi, TP HCM"\n}'),
          box("Kết quả cần kiểm tra", "Response báo thành công; GET /api/customers trả về đúng dữ liệu mới; các trường không gửi trong PATCH vẫn giữ nguyên.", "ok"), PageBreak()]

story += [P("7. Bài 5 - Tạo đơn hàng", "H1VN"),
          P("Đây là luồng có nhiều quan hệ. Trước tiên dùng các API GET để lấy ID thật: customer, employee, delivery company và product đang hoạt động/còn hàng."),
          api_table([
              ("Khách hàng", "GET {{baseUrl}}/api/customers", "Lấy customerId."),
              ("Nhân viên", "GET {{baseUrl}}/api/employees", "Lấy employeeId."),
              ("Đơn vị giao", "GET {{baseUrl}}/api/delivery-companies", "Lấy deliveryCompanyId."),
              ("Sản phẩm", "GET {{baseUrl}}/api/products", "Lấy productId và giá."),
          ]),
          P("Request tạo đơn", "H2VN"), code("POST {{baseUrl}}/api/orders"),
          code('{\n  "customerId": "UUID_KHACH_HANG",\n  "employeeId": "UUID_NHAN_VIEN",\n  "deliveryCompanyId": "UUID_DON_VI_GIAO",\n  "requiredDate": "2026-07-20",\n  "freight": 3.5,\n  "shipName": "TEST_Nguyen Van A",\n  "shipAddress": "123 Duong Test",\n  "shipCity": "Ho Chi Minh City",\n  "shipCountry": "Vietnam",\n  "items": [{\n    "productId": "UUID_SAN_PHAM",\n    "quantity": 1,\n    "discount": 0.1\n  }]\n}'),
          P("Không bắt buộc gửi unitPrice; nếu bỏ qua, server dùng giá hiện tại của sản phẩm. discount từ 0 đến 1; ví dụ 0.1 là giảm 10%."), PageBreak()]

story += [P("7.1 Kiểm tra kết quả đơn hàng", "H1VN"),
          P("Sau khi tạo thành công, ghi lại order ID và kiểm tra ít nhất các điểm sau:"),
          P("• Đơn gắn đúng customer, employee, delivery company.<br/>• Có đúng số dòng items và quantity.<br/>• Giá/discount đúng quy ước.<br/>• Tồn kho thay đổi hợp lý nếu nghiệp vụ có trừ kho.<br/>• GET /api/orders tìm thấy đơn vừa tạo."),
          P("Cập nhật trạng thái", "H2VN"), code("PATCH {{baseUrl}}/api/orders/ORDER_ID/status"),
          code('{\n  "status": "completed"\n}'),
          P("Chỉ dùng một trong ba giá trị: <b>pending</b>, <b>completed</b>, <b>cancelled</b>."),
          box("Ca âm quan trọng", "Thử items rỗng; quantity = 0; discount = 1.5; UUID không tồn tại; status = done. Server phải từ chối và trả message/errors đủ rõ để biết trường nào sai.", "warn"),
          P("Điều chỉnh tồn kho - chỉ khi được phép", "H2VN"), code("POST {{baseUrl}}/api/inventory/adjustments"),
          code('{\n  "productId": "UUID_SAN_PHAM",\n  "type": "in",\n  "quantity": 10,\n  "note": "TEST_Nhap kho bang Postman"\n}'),
          P("type = <b>in</b> để nhập thêm; <b>out</b> để xuất thủ công; <b>audit</b> để đặt tồn kho về một con số chính xác. Audit có tác động lớn, chỉ dùng với dữ liệu test được chỉ định."), PageBreak()]

story += [P("8. Kiểm thử lỗi và phân quyền", "H1VN"),
          P("Một tester tốt không chỉ kiểm tra đường đi đúng. Hãy thay đổi từng yếu tố một để biết chính xác nguyên nhân."),
          api_table([
              ("Thiếu dữ liệu", "Bỏ email/name/items", "Kỳ vọng validation chỉ rõ trường bắt buộc."),
              ("Sai định dạng", "Email = abc; UUID = 123", "Kỳ vọng 4xx, không tạo dữ liệu."),
              ("Sai biên", "quantity = 0; stock = -1", "Kỳ vọng bị từ chối."),
              ("Trùng dữ liệu", "SKU/email/category name đã có", "Kỳ vọng báo trùng rõ ràng."),
              ("Thiếu đăng nhập", "Bỏ Authorization", "Kỳ vọng 401."),
              ("Thiếu quyền", "staff gọi API admin", "Kỳ vọng 403."),
              ("Không tồn tại", "UUID hợp lệ nhưng không có", "Kỳ vọng 404 hoặc lỗi nghiệp vụ rõ ràng."),
          ]),
          P("Cách đọc errors", "H2VN"), code('{\n  "success": false,\n  "message": "Validation failed",\n  "errors": {\n    "items[0].quantity": ["Quantity must be an integer greater than zero."],\n    "customerId": ["Customer does not exist."]\n  }\n}'),
          P("Ở ví dụ trên, dòng hàng đầu tiên có quantity sai và customerId không tồn tại. Sửa đúng hai trường đó rồi gửi lại."),
          box("Mỗi lần chỉ đổi một biến", "Nếu vừa đổi token, Body và URL cùng lúc, bạn sẽ khó biết yếu tố nào gây lỗi. Hãy tạo Duplicate request trước khi thử ca âm.", "info"), PageBreak()]

story += [P("9. Danh mục API nhanh", "H1VN"),
          api_table([
              ("Health", "GET /health", "Công khai, kiểm tra server."),
              ("Auth", "POST /api/signup; POST /api/login", "Tạo tài khoản, đăng nhập."),
              ("User", "GET /api/me; /user-area", "Kiểm tra user/token."),
              ("Role", "GET /api/admin-area; /manager-area", "Kiểm tra phân quyền."),
              ("Categories", "GET; POST /api/categories", "Xem và tạo danh mục."),
              ("Categories", "PATCH /api/categories/:id", "Sửa danh mục."),
              ("Suppliers", "GET; POST /api/suppliers", "Xem và tạo nhà cung cấp."),
              ("Suppliers", "PATCH /api/suppliers/:id", "Sửa nhà cung cấp."),
              ("Delivery", "GET; POST /api/delivery-companies", "Xem và tạo đơn vị giao."),
              ("Delivery", "PATCH /api/delivery-companies/:id", "Sửa đơn vị giao."),
              ("Employees", "GET; POST /api/employees", "Xem và tạo nhân viên."),
              ("Employees", "PATCH /api/employees/:id", "Sửa nhân viên."),
          ]), PageBreak()]

story += [P("9. Danh mục API nhanh - tiếp", "H1VN"),
          api_table([
              ("Products", "GET; POST /api/products", "Xem và tạo sản phẩm."),
              ("Products", "PATCH; DELETE /api/products/:id", "Sửa hoặc vô hiệu hóa."),
              ("Inventory", "GET /api/inventory", "Xem tồn kho."),
              ("Inventory", "POST /api/inventory/adjustments", "Điều chỉnh tồn kho."),
              ("Customers", "GET; POST /api/customers", "Xem và tạo khách hàng."),
              ("Customers", "PATCH /api/customers/:id", "Sửa khách hàng."),
              ("Orders", "GET; POST /api/orders", "Xem và tạo đơn."),
              ("Orders", "PATCH /api/orders/:id/status", "Đổi trạng thái đơn."),
              ("Users", "PATCH /api/users/:id/roles", "Admin đổi roles."),
          ]),
          Spacer(1, 6*mm), box("Swagger", "Tài liệu tương tác production: <b>https://thaotesting-git-main-minhdubai.vercel.app/api-docs</b><br/>OpenAPI JSON: <b>https://thaotesting-git-main-minhdubai.vercel.app/api-docs.json</b>", "info"),
          P("Quyền mặc định", "H2VN"),
          P("<b>admin</b>: toàn quyền, gồm đổi role user. <b>manager</b>: quản lý sản phẩm, danh mục, nhà cung cấp, tồn kho, khách hàng, giao hàng, nhân viên, đơn hàng. <b>staff</b>: đọc dữ liệu chính và tạo khách hàng/đơn hàng. <b>user</b>: quyền cơ bản theo cấu hình server."), PageBreak()]

story += [P("10. Checklist trước khi báo lỗi", "H1VN"),
          P("□ Đã chọn đúng Environment.<br/>□ Method và URL chính xác.<br/>□ Request cần đăng nhập đã có Bearer Token.<br/>□ Body chọn raw + JSON, dấu ngoặc và dấu phẩy hợp lệ.<br/>□ ID dùng trong URL/Body là ID thật và đúng loại dữ liệu.<br/>□ Có thể lặp lại lỗi ít nhất hai lần.<br/>□ Đã thử lại bằng request tối giản hoặc tài khoản đúng quyền.<br/>□ Không để lộ token/mật khẩu trong ảnh báo lỗi."),
          P("Mẫu nội dung bug report", "H2VN"),
          code('Tiêu đề: [API][Orders] Không báo lỗi khi quantity = 0\nMôi trường: Production - 11/07/2026 10:30 GMT+7\nTài khoản/role: tester.staff@example.com / staff\nMethod + URL: POST {{baseUrl}}/api/orders\nĐiều kiện trước: token hợp lệ, các ID tồn tại\nBước thực hiện: 1... 2... 3...\nKết quả thực tế: Status..., response...\nKết quả mong đợi: Từ chối và báo quantity > 0\nTần suất: 3/3\nĐính kèm: Postman request/response đã che token'),
          box("Mẹo chụp bằng chứng", "Mở Postman Console nếu cần xem request thực tế. Che Authorization, password và token. Giữ lại request body, status, response body, thời gian và correlation/request ID nếu server trả về.", "ok"),
          P("Nguồn tài liệu", "H2VN"),
          P("Nội dung được biên soạn từ README.md của dự án Manual Auth Supabase Node Backend tại thời điểm 11/07/2026. Khi hành vi thực tế khác tài liệu, ưu tiên ghi nhận bằng chứng từ response và đối chiếu Swagger/OpenAPI hiện hành."),
          Spacer(1, 12*mm), HRFlowable(width="100%", thickness=1, color=BORDER), Spacer(1, 5*mm),
          P("Bạn đã sẵn sàng: Health → Login → Token → GET → POST/PATCH → Negative test", "H2VN")]

doc.build(story)
print(OUT)
