import NaverMap from '@/components/NaverMap';
import fs from 'fs';
import path from 'path';

// Read static location data
async function getLocations() {
  const filePath = path.join(process.cwd(), 'src/data/locations.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading locations data:', error);
    return [];
  }
}

export default async function Home() {
  const locations = await getLocations();

  return (
    <main className="flex h-screen flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">주택 위치 정보 안내</h1>
          <p className="text-sm text-gray-500 mt-1">총 {locations.length}개의 주택 위치가 지도에 표시됩니다.</p>
        </div>
        <div className="flex items-center space-x-2">
           <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200 flex items-center shadow-sm">
             <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
             보안 접속됨
           </span>
        </div>
      </header>
      
      <div className="flex-1 w-full bg-gray-100 relative">
        <NaverMap locations={locations} />
      </div>
    </main>
  );
}
