'use client';

import { Card } from '@/components/ui/card';

export function Founders() {
  // Bạn hãy thay đổi thông tin và link ảnh của team mình ở đây nhé
  const team = [
    {
      name: " Minh Triết B7",
      role: "Lead Developer / Founder",
      description: "Chịu trách nhiệm chính về logic AI và hệ thống vận hành của SAT PrepMaster.",
      image: "/picture/triet.png", // Thay bằng link ảnh thật
      color: "bg-blue-500"
    },
    {
      name: "Hiểu Khang B7",
      role: "Content Manager",
      description: "Xây dựng bộ câu hỏi và tối ưu hóa trải nghiệm học tập cho người dùng.",
      image: "/picture/tuat.jpg", // Thay bằng link ảnh thật
      color: "bg-purple-500"
    },
    {
      name: "Bùi Quân B7",
      role: "UI/UX Designer",
      description: "Thiết kế giao diện người dùng, đảm bảo web luôn mượt mà và dễ sử dụng.",
      image: "/picture/tuat2.png", // Thay bằng link ảnh thật
      color: "bg-emerald-500"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-900">Đội Ngũ Sáng Lập</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Chúng mình là nhóm học sinh đam mê công nghệ, với mục tiêu xây dựng một nền tảng học tập SAT thông minh và miễn phí cho mọi người.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {team.map((member, index) => (
          <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className={`${member.color} h-24`}></div>
            <div className="px-6 pb-8">
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-white mx-auto shadow-md">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">
                  {member.role}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {member.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 rounded-2xl p-8 text-center mt-12">
        <h2 className="text-2xl font-bold text-blue-900 mb-2">Về Dự Án SAT PrepMaster</h2>
        <p className="text-blue-800 text-sm max-w-3xl mx-auto">
          Dự án được khởi nguồn từ ý tưởng kết hợp trí tuệ nhân tạo (AI) vào việc ôn luyện SAT, giúp cá nhân hóa lộ trình học tập và tiết kiệm thời gian cho học sinh.
        </p>
      </div>
    </div>
  );
}