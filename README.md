# diss
Website Vulnerability Scanning Site(XSS, Sql Injection, Path tarversal, OS Command Injection etc ...)

# How to use
1. app.js를 실행하여 백엔드 서버를 작동시킴
2. 해당하는 url로 접속후 원하는 공격 카테고리로 접근함(xss의 경우 fast, accurate 두가지 버전을 제공함 *fast의 경우 request 모듈만을 사용 -> 빠른 스캐닝 가능 but 오탐률 높아짐 *accurate의 경우 브라우저 컨트롤이 가능한 모듈을 사용 -> 스캐닝 느림 but 오탐률이 낮아짐)
3. 점검을 하고 싶은 url을 입력 후 돋보기 버튼을 누름
4. 스캐닝이 끝나면 결과창이 나옴

# Images
1. site_depth_flow
![대체 텍스트](./how-to-use/images/depth_flow.png)
2. xss_scaning_page
![대체 텍스트](./how-to-use/images/xss.png)
3. xss_result_page
![대체 텍스트](./how-to-use/images/xss_res.png)
4. xss_fast_flow
![대체 텍스트](./how-to-use/images/xss_flow_fast.png)
5. xss_accurate_flow
![대체 텍스트](./how-to-use/images/xss_flow_acc.png)
6. pathtraversal_page
![대체 텍스트](./how-to-use/images/pathtrav.png)
7. pathtraversal_result_page
![대체 텍스트](./how-to-use/images/pathtrav_res.png)
8. pathtraversal_flow
![대체 텍스트](./how-to-use/images/path_flow.png)
9. os_command_injection_page
![대체 텍스트](./how-to-use/images/oscmnd.png)
10. os_command_injection_result_page
![대체 텍스트](./how-to-use/images/os_cmnd_res.png)
11. os_command_injection_flow
![대체 텍스트](./how-to-use/images/os_cmnd_flow.png)
