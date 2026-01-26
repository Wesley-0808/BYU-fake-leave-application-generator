import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home'),
  },
  {
    path: '/generator',
    name: 'generator',
    component: () => import('@/views/generator'),
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
