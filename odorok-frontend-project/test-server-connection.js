// 서버 연결 테스트 스크립트
const axios = require('axios');

async function testServerConnection() {
  const serverUrl = 'http://odorok.duckdns.org:8080';
  
  console.log(`서버 연결 테스트 시작: ${serverUrl}`);
  
  try {
    // 기본 연결 테스트
    const response = await axios.get(`${serverUrl}/api/health`, {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // 500 미만은 성공으로 간주
      }
    });
    
    console.log('✅ 서버 연결 성공!');
    console.log('상태 코드:', response.status);
    console.log('응답 데이터:', response.data);
    
  } catch (error) {
    console.log('❌ 서버 연결 실패!');
    
    if (error.code === 'ECONNABORTED') {
      console.log('원인: 요청 타임아웃 (10초 초과)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('원인: 도메인을 찾을 수 없음 (DNS 오류)');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('원인: 연결 거부됨 (서버가 실행되지 않음)');
    } else if (error.code === 'ERR_NETWORK') {
      console.log('원인: 네트워크 오류');
    } else {
      console.log('원인:', error.message);
    }
    
    console.log('\n해결 방법:');
    console.log('1. 서버가 실행 중인지 확인');
    console.log('2. 방화벽 설정 확인');
    console.log('3. 네트워크 연결 상태 확인');
    console.log('4. 도메인 주소가 올바른지 확인');
  }
}

testServerConnection();
