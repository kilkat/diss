const reflected_xss_success = async(req, res) => {
    try{
        /*
        애초에 넘어올때 로그인 정보도 넘겨줌 -> 로그인 정보에 따라서 cnt값 따로 저장 -> payload날리는 controller에서 마지막
        payload 날리고 연결되어 있는 url 세션 죽이는 값 날림 -> 최종 cnt 값 계산 -> 성공횟수 계산후 print
        */
        var cnt = 0;

    }catch(error){
        console.log(error);
    }
}

module.exports = {
    reflected_xss_success,

}