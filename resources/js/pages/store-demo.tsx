import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Layout, Grid3X3, MousePointer, Star, Zap, Shield, Navigation, Users, Briefcase, MessageSquare, Mail, Image, Play, DollarSign, Minus } from 'lucide-react';
import storeLayout from '@/data/store-landing-layout.json';

const iconMap: { [key: string]: any } = {
  Layout, Grid3X3, MousePointer, Star, Zap, Shield, Navigation, Users, Briefcase, MessageSquare, Mail, Image, Play, DollarSign, Minus
};

export default function StoreDemo() {
  const [layout] = useState(storeLayout);

  const renderBlock = (block: any) => {
    const { config } = block;
    
    switch (block.type) {
      case 'header':
        return (
          <header className="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
            <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
              <a href="#" className="flex items-center">
                <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">{config.logo}</span>
              </a>
              <div className="flex items-center lg:order-2">
                <Button className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800">
                  {config.buttonText}
                </Button>
              </div>
              <div className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1">
                <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
                  {config.menuItems?.map((item: string, index: number) => (
                    <li key={index}>
                      <a href="#" className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </header>
        );

      case 'hero':
        return (
          <section className="bg-white dark:bg-gray-900">
            <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
              <div className="mr-auto place-self-center lg:col-span-7">
                <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">{config.title}</h1>
                <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">{config.subtitle}</p>
                <Button className="inline-flex items-center justify-center px-5 py-3 mr-3 text-base font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900">
                  {config.buttonText}
                  <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </Button>
                <Button variant="outline" className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
                  Watch Demo
                </Button>
              </div>
              <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
                <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                  Store Preview
                </div>
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section className="bg-white dark:bg-gray-900">
            <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
              <div className="max-w-screen-md mb-8 lg:mb-16">
                <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">{config.title}</h2>
                <p className="text-gray-500 sm:text-xl dark:text-gray-400">Discover powerful features that make WhatsStore the perfect solution for modern businesses.</p>
              </div>
              <div className="space-y-8 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-12 md:space-y-0">
                {config.items?.map((item: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
                      {iconMap[item.icon] && React.createElement(iconMap[item.icon], { className: "w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300" })}
                    </div>
                    <h3 className="mb-2 text-xl font-bold dark:text-white">{item.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'about':
        return (
          <section className="bg-gray-50 dark:bg-gray-800">
            <div className="gap-16 items-center py-8 px-4 mx-auto max-w-screen-xl lg:grid lg:grid-cols-2 lg:py-16 lg:px-6">
              <div className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
                <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">{config.title}</h2>
                <p className="mb-4">{config.description}</p>
                <p>Experience the future of networking with features designed for today's digital-first world.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="w-full rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 h-32 flex items-center justify-center text-white font-semibold">
                  QR Codes
                </div>
                <div className="mt-4 w-full lg:mt-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 h-32 flex items-center justify-center text-white font-semibold">
                  NFC Cards
                </div>
              </div>
            </div>
          </section>
        );

      case 'services':
        return (
          <section className="bg-white dark:bg-gray-900">
            <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
              <div className="mx-auto max-w-screen-md text-center mb-8 lg:mb-12">
                <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">{config.title}</h2>
                <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">Start free and scale as you grow. All plans include our core features.</p>
              </div>
              <div className="space-y-8 lg:grid lg:grid-cols-3 sm:gap-6 xl:gap-10 lg:space-y-0">
                {config.services?.map((service: any, index: number) => (
                  <div key={index} className={`flex flex-col p-6 mx-auto max-w-lg text-center text-gray-900 bg-white rounded-lg border shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white ${index === 1 ? 'border-primary-600 scale-105' : 'border-gray-100'}`}>
                    {index === 1 && (
                      <div className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-primary-200 dark:text-primary-800 w-fit mx-auto mb-4">
                        Most Popular
                      </div>
                    )}
                    <h3 className="mb-4 text-2xl font-semibold">{service.title}</h3>
                    <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">{service.description}</p>
                    <div className="flex justify-center items-baseline my-8">
                      <span className="mr-2 text-5xl font-extrabold">{service.price}</span>
                      {service.price !== 'Free' && <span className="text-gray-500 dark:text-gray-400">/month</span>}
                    </div>
                    <ul role="list" className="mb-8 space-y-4 text-left">
                      {service.features?.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center space-x-3">
                          <svg className="flex-shrink-0 w-5 h-5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className={`text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center ${index === 1 ? 'bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900' : 'bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 dark:text-white dark:focus:ring-primary-900'}`}>
                      Get started
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section className="bg-gray-50 dark:bg-gray-800">
            <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-6">
              <div className="mx-auto max-w-screen-sm">
                <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white">{config.title}</h2>
                <p className="mb-8 font-light text-gray-500 lg:mb-16 sm:text-xl dark:text-gray-400">See what businesses are saying about WhatsStore</p>
              </div>
              <div className="grid mb-8 lg:mb-12 lg:grid-cols-2">
                {config.testimonials?.map((testimonial: any, index: number) => (
                  <figure key={index} className="flex flex-col justify-center items-center p-8 text-center bg-white border-b border-gray-200 md:p-12 lg:border-r dark:bg-gray-800 dark:border-gray-700">
                    <blockquote className="mx-auto mb-8 max-w-2xl text-gray-500 dark:text-gray-400">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{testimonial.title}</h3>
                      <p className="my-4">"{testimonial.content}"</p>
                    </blockquote>
                    <figcaption className="flex justify-center items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                      <div className="space-y-0.5 font-medium dark:text-white text-left">
                        <div>{testimonial.name}</div>
                        <div className="text-sm font-light text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section className="bg-white dark:bg-gray-900">
            <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
              <div className="mx-auto max-w-screen-sm text-center">
                <h2 className="mb-4 text-4xl tracking-tight font-extrabold leading-tight text-gray-900 dark:text-white">{config.title}</h2>
                <p className="mb-6 font-light text-gray-500 dark:text-gray-400 md:text-lg">{config.description}</p>
                <Button className="text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800">
                  {config.buttonText}
                </Button>
              </div>
            </div>
          </section>
        );

      case 'contact':
        return (
          <section className="bg-gray-50 dark:bg-gray-800">
            <div className="py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
              <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-center text-gray-900 dark:text-white">{config.title}</h2>
              <p className="mb-8 lg:mb-16 font-light text-center text-gray-500 dark:text-gray-400 sm:text-xl">{config.description}</p>
              <form className="space-y-8">
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Your email</label>
                  <input type="email" id="email" className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light" placeholder="name@whatsstore.com" required />
                </div>
                <div>
                  <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Subject</label>
                  <input type="text" id="subject" className="block p-3 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 dark:shadow-sm-light" placeholder="Let us know how we can help you" required />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400">Your message</label>
                  <textarea id="message" rows={6} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg shadow-sm border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Leave a comment..."></textarea>
                </div>
                <Button type="submit" className="py-3 px-5 text-sm font-medium text-center text-white rounded-lg bg-primary-700 sm:w-fit hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                  Send message
                </Button>
              </form>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900 mx-auto">
                    <Mail className="w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300" />
                  </div>
                  <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Email us:</p>
                  <p className="text-gray-500 dark:text-gray-400">{config.email}</p>
                </div>
                <div>
                  <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900 mx-auto">
                    <svg className="w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                  </div>
                  <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Call us:</p>
                  <p className="text-gray-500 dark:text-gray-400">{config.phone}</p>
                </div>
                <div>
                  <div className="flex justify-center items-center mb-4 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900 mx-auto">
                    <svg className="w-5 h-5 text-primary-600 lg:w-6 lg:h-6 dark:text-primary-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                  </div>
                  <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Visit us:</p>
                  <p className="text-gray-500 dark:text-gray-400">{config.address}</p>
                </div>
              </div>
            </div>
          </section>
        );

      case 'footer':
        return (
          <footer className="p-4 bg-gray-800 md:p-8 lg:p-10">
            <div className="mx-auto max-w-screen-xl text-center">
              <a href="#" className="flex justify-center items-center text-2xl font-semibold text-white">
                {config.companyName}
              </a>
              <p className="my-6 text-gray-400">{config.description}</p>
              <ul className="flex flex-wrap justify-center items-center mb-6 text-white">
                {config.links?.map((link: any, index: number) => (
                  <li key={index}>
                    <a href={link.url} className="mr-4 hover:underline md:mr-6">{link.title}</a>
                  </li>
                ))}
              </ul>
              <span className="text-sm text-gray-500 sm:text-center">© 2023 <a href="#" className="hover:underline">{config.companyName}</a>. All Rights Reserved.</span>
            </div>
          </footer>
        );

      default:
        return <div className="p-4 border-2 border-dashed border-gray-300">Unknown block type: {block.type}</div>;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="space-y-0">
        {layout.map((block, index) => (
          <div key={block.id}>
            {renderBlock(block)}
          </div>
        ))}
      </div>
    </div>
  );
}