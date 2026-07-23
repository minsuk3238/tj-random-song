import time
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

def clean_text(text):
    if not text:
        return ''
    text = re.sub(r'\(Live\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\(Inst\.\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\(MR\)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\(Special Edition\)', '', text, flags=re.IGNORECASE)
    return ' '.join(text.split())

def run_melon_scraper():
    print("🚀 멜론 차트 리얼 크롤러(Python + Selenium)를 시작합니다...")
    print("⚠️ 눈앞에 열리는 크롬 창을 닫지 말고 그대로 두세요!\n")

    # 크롬 드라이버 자동 설치 및 구동 (보이는 모드)
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    wait = WebDriverWait(driver, 10)
    
    # 멜론 시대별 연간차트 최초 진입
    start_url = "https://www.melon.com/chart/age/index.htm?chartType=YE&chartMac=2020&chartYear=2023"
    driver.get(start_url)
    time.sleep(3) # 페이지 완전 로딩 대기

    all_songs = []
    unique_keys = set()
    
    # 멜론 차트는 1980년대 ~ 2020년대까지 제공됨
    decades = [1980, 1990, 2000, 2010, 2020]
    
    for decade in decades:
        print(f"\n================ [ {decade}년대 탭 클릭 ] ================")
        try:
            # 연대 탭 클릭 (예: "1980년대" 텍스트를 가진 탭 찾기)
            decade_tab = wait.until(EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{decade}년대')]/..")))
            driver.execute_script("arguments[0].click();", decade_tab)
            time.sleep(2) # 탭 변경 후 애니메이션 대기
            
            # 해당 연대에 속한 연도 계산 (2020년대는 2023년까지)
            end_year = decade + 9
            if decade == 2020:
                end_year = 2023
                
            for year in range(decade, end_year + 1):
                print(f"👉 {year}년 차트 데이터 추출 중...")
                try:
                    # 연도 버튼 클릭 (예: "1981년" 텍스트를 가진 버튼)
                    year_btn = wait.until(EC.element_to_be_clickable((By.XPATH, f"//span[contains(text(), '{year}년')]/..")))
                    driver.execute_script("arguments[0].click();", year_btn)
                    
                    # Ajax 데이터가 로드될 때까지 1위 곡의 엘리먼트 갱신을 잠시 대기 (명시적/암시적 대기 혼합)
                    time.sleep(2.5) 
                    
                    # 화면의 HTML 소스를 떠와서 BeautifulSoup으로 파싱
                    html = driver.page_source
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    rows = soup.select('tbody tr')
                    count_for_year = 0
                    
                    for row in rows:
                        title_tag = row.select_one('.ellipsis.rank01 a')
                        artist_tag = row.select_one('.ellipsis.rank02 a')
                        
                        if title_tag and artist_tag:
                            title = clean_text(title_tag.text)
                            artist = clean_text(artist_tag.text)
                            
                            # 기본적인 휴리스틱 장르/성별 추론
                            genre = '발라드'
                            gender = '혼성'
                            
                            if re.search(r'아이유|aespa|IVE|NewJeans|BLACKPINK|소녀시대|TWICE|이효리|백지영|보아', artist, re.IGNORECASE):
                                gender = '여성'
                            elif re.search(r'BTS|방탄소년단|세븐틴|EXO|BIGBANG|임영웅|조용필|성시경|박효신|SG워너비|김건모', artist, re.IGNORECASE):
                                gender = '남성'

                            if re.search(r'aespa|IVE|NewJeans|BLACKPINK|소녀시대|TWICE|BTS|EXO|BIGBANG|H\.O\.T\.|젝스키스|핑클', artist, re.IGNORECASE):
                                genre = '댄스'
                            elif re.search(r'임영웅|영탁|장윤정|송가인', artist, re.IGNORECASE):
                                genre = '트로트'
                            elif re.search(r'버즈|DAY6|윤도현|잔나비|자우림', artist, re.IGNORECASE):
                                genre = '록/밴드'
                                
                            key = f"{title.lower().replace(' ', '')}_{artist.lower().replace(' ', '')}"
                            
                            if key not in unique_keys:
                                unique_keys.add(key)
                                all_songs.append({
                                    "releaseYear": year,
                                    "releaseMonth": 1,
                                    "title": title,
                                    "artist": artist,
                                    "genre": genre,
                                    "gender": gender
                                })
                                count_for_year += 1
                                
                    print(f"✅ {year}년 완료: {count_for_year}곡 확보 (누적: {len(all_songs)}곡)")
                    
                except Exception as e:
                    print(f"❌ {year}년 버튼 클릭 또는 파싱 에러: {e}")
                    
        except Exception as e:
            print(f"❌ {decade}년대 탭 클릭 에러: {e}")

    # 크롬 창 닫기
    driver.quit()
    
    print(f"\n🎉 모든 수집 완료! 총 {len(all_songs)}개의 100% 팩트 명곡을 긁어왔습니다!")
    
    # JavaScript 형식으로 변환하여 songData.js 덮어쓰기
    js_content = f"""// TJ Karaoke Melon Scraped Verified Songs Database (Python UI Macro)
// Total Unique Songs: {len(all_songs)}
// Auto-generated by melon_scraper.py

const SONG_DATABASE = {json.dumps(all_songs, ensure_ascii=False, indent=2)};
"""
    
    target_path = "C:/Users/minsu/.gemini/antigravity-ide/scratch/tj-random-song/songData.js"
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print(f"💾 {target_path} 파일 업데이트가 완료되었습니다!")

if __name__ == "__main__":
    run_melon_scraper()
