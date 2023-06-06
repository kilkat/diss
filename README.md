# 수정일지

- **23/05/07**  
  /controllers/register.ctrl.js  
  > db error 해결(user 변수명이 다른거 통합해놓음)  
  > 코드 작성자: 김광운  

<br>

- **23/05/15**  
  /site_depth.js  
  > 사이트 트리 뽑는 로직 구현중  
  > 코드 작성자: ChatGPT3.5  

<br>

- **23/05/16**  
  /site_depth.js  
  > 사이트 트리 뽑는 로직 구현완료(회원페이지, js로 구현된 a태그들은 뽑아올수 없음)  
  > 코드 작성자: ChatGPT3.5  

<br>

- **23/05/16**  
  /site_depth.js  
  > 사이트 트리 뽑는 로직 구현완료(404 status로 인해 서버 죽는 현상 해결완료)  
  > 코드 작성자: 김광운  

<br>

- **23/05/18**  
  /scan.ctrl.js  
  > 사이트 트리 뽑는 로직 구현완료  
  > 코드 작성자: ChatGPT4.0  

<br>

- **23/05/18**  
  /scan.ctrl.js, /site_depth.js -> crawl_depth.js  
  > 사이트 트리 뽑는 로직 분리완료, 이름변경  
  > 코드 작성자: 김광운  

<br>

- **23/05/19**  
  /scan.ctrl.js, /crawl_depth.js, /models/scan.js  
  > scan 결과 구분할 수 있도록 scan 테이블 변경, Path Traversal 및 Reflected XSS가 사이트 뎁스 뽑은 후 각각 스캔하도록 구현, site_depth /xss/xss로 잘못 뽑히는 오류 해결, site_tree 파일 내용 초기화 안 되는 오류 해결, 사용자가 요청한 스캔을 scanID의 숫자로 구분(1부터 1씩 증가)  
  > 코드 작성자: ChatGPT4.0  

<br>

- **23/05/23**  
  /router/index.js, /controllers/scan.ctrl.js, os_command_inecjtion_payload.txt, xss_payload.txt, build  
  > 라우터에 os command injection 스캔 부분 추가, scan 로직에 os command injection 구현, os_command_inejction_payload.txt 페이로드 작성, xss_paylaod.txt 파일 이름 수정  
  > 코드 작성자: 장현호, ChatGPT4.0  

<br>

- **23/05/27**  
  /build, controllers/result.ctrl.js, router/index.js  
  > 프론트 최신 버전 업데이트, result 컨트롤러 만듬(/result_data 페이지에 스캔 결과 DB 데이터 JSON 형태로 보내도록 설정), /result_data get 방식 라우터 설정  
  > 코드 작성자: 장현호  

<br>

- **23/05/31**  
    
  > os_command_injection 부분과 accurate_xss 오류로 30일 거에서 27일 거로 다시 롤백해서 fast_xss 구현  
  > 코드 작성자: 장현호  

<br>

- **23/05/31**  
  /scan.ctrl.js, os_command_injection_payload  
  > 기존의 os_command_injection 로직 오류 해결, os command injection 스캔 정상 작동  
  > 코드 작성자: 장현호  

<br>

- **23/05/31**  
  /controllers/scan.ctrl.js, /models/scan.js, os_command_injection_paylaod.txt
  > DB에 osInfo 추가, path traversal과 os command injection 스캔 시, windows와 linux 서버 구분
  > 코드 작성자: 장현호  

<br>

- **23/06/06**  
  /build, /controllers/scan.ctrl.js, /router/index.js  
  > 프론트 최신 버전으로 업데이트, scanID 오류 해결, 라우팅 오류 해결  
  > 코드 작성자: 장현호  
  /controllers/scan.ctrl.js, /models/scan.js, os_command_injection_paylaod.txt  
  > DB에 osInfo 추가, path traversal과 os command injection 스캔 시, windows와 linux 서버 구분  
  > 코드 작성자: 장현호  