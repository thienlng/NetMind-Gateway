login with SSO feature.

have one more button in login form for user ro login with sso. 
it will redirect user to https://auth.viettel.vn/auth/login?appCode=netmind&service=https://netmind.viettel.vn/gateway/login

and after user login on this page, the page will redirect to own application /login page with addititonal param ticket: 

https://netmind.viettel.vn/gateway/ui/login?redirect=true&ticket=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjVkMDliNTQzLWJmZDMtNDdjZC1iNmQ0LWM4MGFiZWQxNTBlYiIsIm9yZy5hcGVyZW8uY2FzLnNlcnZpY2VzLlJlZ2lzdGVyZWRTZXJ2aWNlIjoiMTA3NyJ9.ZXlKaGJHY2lPaUprYVhJaUxDSmxibU1pT2lKQk1USTRRMEpETFVoVE1qVTJJaXdpWTNSNUlqb2lTbGRVSWl3aWRIbHdJam9pU2xkVUlpd2lhMmxrSWpvaVptVmtNV00wTlRJdFpXUXpZUzAwTWpobExXRXhOamt0WVdRek1UWXhZbVF6WXpnM0lpd2liM0puTG1Gd1pYSmxieTVqWVhNdWMyVnlkbWxqWlhNdVVtVm5hWE4wWlhKbFpGTmxjblpwWTJVaU9pSXhNRGMzSW4wLi5wVmdpRU9jbTVURjVtb3ctcXBjUXpRLlFvN1hqLUQwNFhFMTctUXB0czdlY2VnVVJiendKTFlNVXhERW5NUjVhTng0dTc4bkZkam8tMlBRZ25fWFNHdEN0U3BpTXkzNUVJUnlFYkVBbXpaY1VCa3FlbVpxRnp3V2YxelhPUnMzanZCWFk5ekQzYXYtR3pvWU1lTFU2UWNjb3RIbkRsZl9BRWpSMU9aaW0xS2xWRl9aM0lDQU9yVVRmZlMtbGxXVFRoOHBXd0VKbUU0SE9ZanYtdk9Ta0JENDlLWXd0c2Q1dUZwU0xHWGw1cVN4RGlUaXFwdmpTQUZSRDBlalpNR3hYbEtjeUx2QTU0d0hNVXdscFZiMXRZTWtHWXEyU1NJb1NfcTdRZk5nTUl5cGR6ajNkWjJpVkFNbEtfdUJsbUpDYXJvSlhEN2dRek42NkVZTFZEN2JKOHpNTW5XUXB4b05hbA



curl 'https://netmind.viettel.vn/gateway/ui/login?redirect=true&ticket=eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCIsImtpZCI6IjVkMDliNTQzLWJmZDMtNDdjZC1iNmQ0LWM4MGFiZWQxNTBlYiIsIm9yZy5hcGVyZW8uY2FzLnNlcnZpY2VzLlJlZ2lzdGVyZWRTZXJ2aWNlIjoiMTA3NyJ9.ZXlKaGJHY2lPaUprYVhJaUxDSmxibU1pT2lKQk1USTRRMEpETFVoVE1qVTJJaXdpWTNSNUlqb2lTbGRVSWl3aWRIbHdJam9pU2xkVUlpd2lhMmxrSWpvaVptVmtNV00wTlRJdFpXUXpZUzAwTWpobExXRXhOamt0WVdRek1UWXhZbVF6WXpnM0lpd2liM0puTG1Gd1pYSmxieTVqWVhNdWMyVnlkbWxqWlhNdVVtVm5hWE4wWlhKbFpGTmxjblpwWTJVaU9pSXhNRGMzSW4wLi5wVmdpRU9jbTVURjVtb3ctcXBjUXpRLlFvN1hqLUQwNFhFMTctUXB0czdlY2VnVVJiendKTFlNVXhERW5NUjVhTng0dTc4bkZkam8tMlBRZ25fWFNHdEN0U3BpTXkzNUVJUnlFYkVBbXpaY1VCa3FlbVpxRnp3V2YxelhPUnMzanZCWFk5ekQzYXYtR3pvWU1lTFU2UWNjb3RIbkRsZl9BRWpSMU9aaW0xS2xWRl9aM0lDQU9yVVRmZlMtbGxXVFRoOHBXd0VKbUU0SE9ZanYtdk9Ta0JENDlLWXd0c2Q1dUZwU0xHWGw1cVN4RGlUaXFwdmpTQUZSRDBlalpNR3hYbEtjeUx2QTU0d0hNVXdscFZiMXRZTWtHWXEyU1NJb1NfcTdRZk5nTUl5cGR6ajNkWjJpVkFNbEtfdUJsbUpDYXJvSlhEN2dRek42NkVZTFZEN2JKOHpNTW5XUXB4b05hbA' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'Accept-Language: vi,en-US;q=0.9,en;q=0.8' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -b 'locale=vi-VN; MMAUTHTOKEN=eubup4khiibbigjgfr911auhha; MMUSERID=93tpof51xbyu9ncph6yt1j769e; MMCSRF=5mcfsurbgff8dfo8wenby8pm7y; refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzc0NDI0NTU1LCJ0eXBlIjoicmVmcmVzaCJ9.KEGZEB2r0bqEG-8Kva83USNTFnyvWDqvbK7VWwdBPLA' \
  -H 'Pragma: no-cache' \
  -H 'Referer: https://auth.viettel.vn/' \
  -H 'Sec-Fetch-Dest: document' \
  -H 'Sec-Fetch-Mode: navigate' \
  -H 'Sec-Fetch-Site: same-site' \
  -H 'Sec-Fetch-User: ?1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'



-- 
when receive /login with param ticket, use this api and parse the ticket (keep the fixed Authorization header) chnage the ticket 

curl -X POST \
  https://netmind.viettel.vn/vtnet-assistant/v1/api/ai/getUserInfoFromSsoTicket \
  -H 'Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhaSIsImF1dGhfdG9rZW5fc2Vzc2lvbl9jcmVhdGUiOiIyMDI1LzEwLzMxIDE0OjUxOjMwIiwiZXhwIjo0OTE1NDk3MDkwLCJpYXQiOjE3NjE4OTcwOTAsImp0aSI6IkxnbVVGdUp3ZUVHRGNiUm10UGZuIn0.Ea20zgRuOfGtyaQ-A4ALk7rF4OIZkuR8gDHmpg03AZZLl7B6E21DlEKIdFyjgFacQLMigWdo9aI4XE6_TslF9A' \
  -H 'Content-Type: application/json' \
  -H 'User-Ticket: {ticket}' \
  -d '{
    "service": "https://netmind.viettel.vn/gateway/login",
    "requestFromPrivate": true
}'

-- then the api will response user infor if success:

Success response example:

{
    "userInfo": {
        "fullname": "Nguyễn Văn Hùng",
        "username": "hungnv195",
        "departments_name": "Phòng Trí tuệ Nhân tạo",
        "departments_fullname": "Phòng Trí tuệ Nhân tạo - Trung tâm Nền tảng Công nghệ và Chuyển đổi số - Tổng công ty Mạng lưới Viettel - Công ty mẹ - Tập đoàn Công nghiệp - Viễn thông Quân đội - Tập đoàn Công nghiệp - Viễn thông Quân đội - test - Viễn thông Quân đội",
        "departments_id": 9107891,
        "staff_code": "467075",
        "company_title": "Kỹ sư Phát triển phần mềm",
        "phone": "0395334342",
        "email": "HUNGNV195@VIETTEL.COM.VN"
    }
}

fail response: 
{
    "userInfo": null
}


---
lưu ý quan trọng: không được giải mã ticket 2 lần (vì lần 2 sẽ bị fail response) (nếu ko logout thì auth.viettel.vn sẽ luôn gửi về cùng 1 ticket)
phải logout và tạo ticket mới

api gửi để logout : https://auth.viettel.vn/auth/logout?appCode=netmind&service=https://netmind.viettel.vn/gateway/login


---

nêu login lần đầu (người dùng chưa có trong db) thì sẽ tạo mới user với các thông tin nhận được trên.


----
cùng với đó cập nhật bảng db schema user để bổ sung các thông tin bạn nhận được trên.


-----

cùng với đó triển khai alembic (or any other tool) để update db schema user.
và hướng dẫn tôi chi tiết cách update (ví dụ update khi đã có version deploy trên server, thì cần gitclone repos version mới, build image và migrate db như nào). viết hướng dẫn vào ./attached_assets/guide_deploy.md