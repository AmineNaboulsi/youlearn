import React from 'react';
import { CalendarIcon, TagIcon, ClockIcon } from 'lucide-react';

type CourseType = {
  cat_id: number,
  content: string,
  contenttype: string,
  description: string,
  id: number,
  img: string,
  instructor: string,
  isprojected: boolean,
  price: number,
  Categorie: string,
  subtitle: string,
  tags: [],
  title: string
}

type CourseViewProps = {
  Course: CourseType | undefined;
}

const CourseView: React.FC<CourseViewProps> = ({ Course }) => {
  if (!Course) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="col-span-4 py-20">
                <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" className="animate-spin text-center justify-self-center will-change-transform" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
          </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-sm text-gray-500 mb-6">
        <span className="hover:text-blue-600 cursor-pointer">Accueil</span> &gt; <span className="hover:text-blue-600 cursor-pointer">{Course.Categorie}</span> &gt; <span className="text-gray-800">{Course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{Course.title}</h1>
            <p className="text-xl text-gray-600 mt-2">{Course.subtitle}</p>
          </div>

          <div className="rounded-xl overflow-hidden bg-gray-900 shadow-xl aspect-video relative">
            {Course.contenttype === 'video' ? (
              <iframe 
                className="w-full h-full"
                src={Course.content}
                title={Course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="p-8 bg-gray-100 h-full">
                <div dangerouslySetInnerHTML={{ __html: Course.content }} />
              </div>
            )}
          </div>

         

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">À propos de ce cours</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: Course.description }} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-md">
            {Course.img ? (
              <img 
                src={Course.img} 
                alt={Course.title} 
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">Image non disponible</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold">
                {Course.price > 0 ? `${Course.price} €` : 'Gratuit'}
              </span>
              <span className={`px-3 py-1 rounded text-sm ${Course.isprojected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {Course.isprojected ? 'Accès illimité' : 'Accès limité'}
              </span>
            </div>
          
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Détails du cours</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <CalendarIcon size={16} className="mr-2 text-gray-500" />
                <span>Mise à jour récente</span>
              </li>
              <li className="flex items-center text-sm">
                <ClockIcon size={16} className="mr-2 text-gray-500" />
                <span>6 heures de contenu</span>
              </li>
              <li className="flex items-center text-sm">
                <TagIcon size={16} className="mr-2 text-gray-500" />
                <span>{Course.Categorie}</span>
              </li>
            </ul>
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default CourseView;