<template>
  <div class="member_list-wrap" :class="{ login: isAdmin}">
    <div class="admin_login-area">
      <button v-if="!isAdmin" @click="goLogin">Login</button>
      <button v-else @click="logout">Logout</button>
    </div>

    <ul class="tab-list">
      <li><button class="tab-item list active">Members</button></li>
      <li><button class="tab-item member" @click="goGatherList">Schedule</button></li>
    </ul>
    
    <div class="list-wrap">
      <div class="sort-wrap">
        <div class="sort_btn-area">
          <button class="btn1" @click="sortByAttend">{{ isAttendSorted ? '초기화' : '참여순' }}</button>
          <button class="btn2" @click="toggleBirthFilter">{{ isBirthFiltered ? '전체' : '이번 달 생일' }}</button>
          <button class="btn3" @click="sortByName">이름순</button>
          <button class="btn4" @click="sortByLeader">{{ isLeaderSorted ? '초기화' : '벙주순' }}</button>
        </div>
        <div class="gender_sort-area">
          <span class="frm-radio">
            <input type="radio" id="total_gender" name="gender" value="total" v-model="selectedGender" checked><label for="total_gender">전체</label>
          </span>
          <span class="frm-radio">
            <input type="radio" id="gender_man" name="gender" value="man" v-model="selectedGender"><label for="gender_man">남자</label>
          </span>
          <span class="frm-radio">
            <input type="radio" id="gender_woman" name="gender" value="woman" v-model="selectedGender"><label for="gender_woman">여자</label>
          </span>
        </div>
        <div class="select_sort-area">
          <div>
            <span class="s-tit">연도</span>
            <span class="selectBox">
              <select name="birthYear" v-model="selectedBirthYear" @change="filterByBirthYear">
                <option value="total">전체</option>
                <option 
                  v-for="num in 13" 
                  :key="num"
                  :value="String(98 - num)"
                >
                  {{ 98 - num }}
                </option>
              </select>
            </span>
          </div>
          <div>
            <span class="s-tit">남은기간</span>
            <span class="selectBox">
              <select id="period" v-model="selectedPeriod">
                <option value="total">total</option>
                <option value="7">7일</option>
                <option value="15">15일</option>
              </select>
            </span>
          </div>
          <div>
            <span class="s-tit">이름</span>
            <div class="frm">
              <input type="text" placeholder="이름을 입력하세요" v-model="searchName">
            </div>
          </div>
        </div>
      </div>

      <div class="total-count-area">
        총 <span class="total-count">{{ displayedMembers.length }}</span> 명
      </div>

      <ul class="member-list" v-if="pagedMembers.length">
        <li v-for="member in pagedMembers" :key="member._id" :class="{ manage: String(member.manage).toUpperCase() === 'Y', birth: isBirthThisMonth(member.birth) }">
          <div class="user_info-area">
            <div class="nga-area">
              <div class="info user-info">
                <div class="name-info">
                  <a v-if="isAdmin" @click.prevent="goEdit(member._id)">{{ member.member_name }}</a>
                  <span v-else>{{ member.member_name }}</span>
                </div>
              </div>
              <div class="info">
                <span class="addr">{{ member.addr }}</span>,
                <span class="gender">{{ displayGender(member.gender) }}</span>
              </div>
            </div>
            <div class="br-area">
              <div class="info" :class="{ birth: isBirthThisMonth(member.birth) }">
                <span>생일 : </span>
                <span>
                  {{ formatBirth(member.birth) }}
                </span>
              </div>
              <div class="info">
                <span>가입일 : </span>
                <span class="regdate" :class="{ new: isNew(member.regist_date) }">{{ formatYYMMDD(member.regist_date) }}</span>
              </div>
            </div>
            <div class="info">
              <span class="dday">월 1회 참석 : {{ getDday(member) }}</span>
            </div>
            <div class="info">
              <span class="participaion-cnt">총 참석횟수 : {{ getTotalParticipation(member._id) }}</span>
              <div class="tbl-area">
                <span>월별 참석 횟수</span>
                <ul class="month-check">
                  <li
                    v-for="mon in 12"
                    :key="mon"
                    class="month-cnt"
                    :data-month="String(mon).padStart(2, '0')"
                  >
                    <span class="mon">{{ mon }}월</span>
                    <span class="num">{{ getMonthValue(member, mon) }}</span>
                  </li>
                </ul>   
              </div>
            </div>
            <div class="info leader-info" v-if="leaderMonths(member).length">
              <span>벙주 횟수: </span>
              <div class="leader-cnt">
                <ul class="leader-check">
                  <li
                    v-for="mon in leaderMonths(member)"
                    :key="'leader-'+mon"
                  >
                    <span class="mon">{{ mon }}월 :</span> 
                    <span class="num">{{ getLeaderMonthValue(member, mon) }} 회</span>
                  </li>
                </ul>
              </div>
            </div>
            <!-- <div class="info"><span>{{ member.new_check }}</span></div> -->
            <div class="user_del-area" v-if="isAdmin">
              <button @click="remove(member._id)">삭제</button>
            </div>
          </div>
        </li>
      </ul>
      <div class="no_data" v-else>
        <p>등록된 회원이 없습니다.</p>
      </div>

      <div v-if="isAdmin" class="btn_reg-area">
        <button @click="$router.push('/members/new')">등록</button>
      </div>

      <div class="pagination" v-if="pages.length > 1" style="margin-top:12px; display:flex; gap:8px; justify-content:center;">
        <button class="btn-prev" @click="prevPage" :disabled="currentPage === 1">이전</button>
        <button
          v-for="p in pages"
          :key="p"
          :class="{ active: currentPage === p }"
          @click="goPage(p)"
        >{{ p }}</button>
        <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">다음</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { getMembers, deleteMember } from '@/api/members'
import { getSchedules } from '@/api/schedules'
import { useRouter } from 'vue-router'

const router = useRouter()
const members = ref([])
const isAttendSorted = ref(false)
const originMembers = ref([])
const selectedBirthYear = ref('total')
const selectedPeriod = ref('total')
const selectedGender = ref('total')
const searchName = ref('')
const schedule = ref([])
const pageSize = 10
const currentPage = ref(1)


const load = async () => {
  try {
    const resMembers = await getMembers()
    members.value = resMembers.data
    originMembers.value = [...resMembers.data]
  } catch {}
  try {
    const resSchedule = await getSchedules()
    schedule.value = resSchedule.data
  } catch {
    schedule.value = []
  }
}

const goEdit = (id) => {
  router.push(`/members/${id}`)
}

const remove = async (id) => {
  if (!confirm('삭제하시겠습니까?')) return
  await deleteMember(id)
  load()
}

const isAdmin = ref(false)

onMounted(() => {
  isAdmin.value = localStorage.getItem('isAdmin') === 'true'
})

const goLogin = () => {
  router.push('/login')
}

const goGatherList = () => {
  router.push('/schedule')
}

const logout = () => {
  localStorage.removeItem('isAdmin')
  isAdmin.value = false
}

const isBirthThisMonth = (birth) => {
  if (!birth) return false

  const m = birthMonthOf(birth)

  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')

  return m === currentMonth
}

const monthlyCounts = computed(() => {
  const map = new Map()
  for (const g of schedule.value) {
    const baseDate = g.date
    const arr = g.participants || []
    for (const p of arr) {
      const d = parseYYMMDD(p.date || baseDate)
      if (!d) continue
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const id = p.id
      const rec = map.get(id) || {}
      rec[mm] = (rec[mm] || 0) + 1
      map.set(id, rec)
    }
  }
  return map
})
const getMonthValue = (member, mon) => {
  const key = String(mon).padStart(2, '0')
  const rec = monthlyCounts.value.get(member._id)
  return (rec && rec[key]) ? rec[key] : 0
}

const leaderMonthlyCounts = computed(() => {
  const map = new Map()
  for (const g of schedule.value) {
    const leaderId = g.leader_id
    if (!leaderId) continue
    const d = parseYYMMDD(g.date)
    if (!d) continue
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const rec = map.get(leaderId) || {}
    rec[mm] = (rec[mm] || 0) + 1
    map.set(leaderId, rec)
  }
  return map
})
const getLeaderMonthValue = (member, mon) => {
  const key = String(mon).padStart(2, '0')
  const rec = leaderMonthlyCounts.value.get(member._id)
  return (rec && rec[key]) ? rec[key] : 0
}
const leaderMonths = (member) => {
  const arr = []
  for (let i = 1; i <= 12; i++) {
    if (getLeaderMonthValue(member, i) > 0) arr.push(i)
  }
  return arr
}

const formatYYMMDD = (value) => {
  if (!value) return ''

  // 이미 YYMMDD면 그대로
  if (/^\d{6}$/.test(value)) return value

  const d = new Date(value)
  if (isNaN(d)) return value

  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}${mm}${dd}`
}

const formatBirth = (value) => {
  if (!value) return ''
  const s = String(value)
  if (/^\d{6}$/.test(s)) {
    return `${s.slice(0,2)}.${s.slice(2,4)}.${s.slice(4,6)}`
  }
  if (/^\d{8}$/.test(s)) {
    const yy = s.slice(2,4)
    const mm = s.slice(4,6)
    const dd = s.slice(6,8)
    return `${yy}.${mm}.${dd}`
  }
  const d = new Date(s)
  if (isNaN(d)) return s
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

const birthMonthOf = (value) => {
  if (!value) return null
  const s = String(value).trim()
  if (/^\d{6}$/.test(s)) return s.slice(2, 4)
  if (/^\d{8}$/.test(s)) return s.slice(4, 6)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.slice(5, 7)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.slice(0, 2)
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s.slice(0, 2)
  const d = new Date(s)
  if (!isNaN(d)) return String(d.getMonth() + 1).padStart(2, '0')
  return null
}

const isNew = (value) => {
  if (!value) return false
  let d
  if (/^\d{6}$/.test(value)) {
    const yy = parseInt(value.slice(0, 2), 10)
    const fullYear = yy >= 70 ? 1900 + yy : 2000 + yy
    const mm = parseInt(value.slice(2, 4), 10) - 1
    const dd = parseInt(value.slice(4, 6), 10)
    d = new Date(fullYear, mm, dd)
  } else {
    d = new Date(value)
  }
  if (isNaN(d)) return false
  const now = new Date()
  const diffMs = now - d
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000
  return diffMs >= 0 && diffMs <= oneMonthMs
}

const parseYYMMDD = (value) => {
  if (!value) return null
  if (/^\d{6}$/.test(value)) {
    const yy = parseInt(value.slice(0, 2), 10)
    const fullYear = yy >= 70 ? 1900 + yy : 2000 + yy
    const mm = parseInt(value.slice(2, 4), 10) - 1
    const dd = parseInt(value.slice(4, 6), 10)
    return new Date(fullYear, mm, dd)
  }
  const d = new Date(value)
  return isNaN(d) ? null : d
}

const latestGatherDateFor = (memberId) => {
  let latest = null
  for (const g of schedule.value) {
    const found = (g.participants || []).find(p => p.id === memberId)
    if (found) {
      const pd = parseYYMMDD(found.date || g.date)
      if (!pd) continue
      if (!latest || pd > latest) latest = pd
    }
  }
  return latest
}

const getGatherDday = (memberId) => {
  const d = latestGatherDateFor(memberId)
  if (!d) return ''
  const target = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diffDays = Math.ceil((target - now) / (24 * 60 * 60 * 1000))
  if (diffDays <= 0) return 'D-0'
  return `D-${diffDays}`
}
const getDday = (member) => {
  const latest = latestGatherDateFor(member._id)
  if (latest) {
    const target = new Date(latest.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const diff = Math.ceil((target - now) / (24 * 60 * 60 * 1000))
    return diff <= 0 ? 'D-0' : `D-${diff}`
  }
  const reg = parseYYMMDD(member.regist_date)
  if (!reg) return ''
  const now = new Date()
  const diff = Math.floor((now - reg) / (24 * 60 * 60 * 1000))
  return diff >= 0 ? `D+${diff}` : `D-${Math.abs(diff)}`
}
const getTotalParticipation = (memberId) => {
  const rec = monthlyCounts.value.get(memberId)
  if (!rec) return 0
  return Object.values(rec).reduce((sum, n) => sum + (n || 0), 0)
}
const isNameAsc = ref(true)
const sortByName = () => {
  const dir = isNameAsc.value ? 1 : -1
  members.value = [...members.value].sort((a, b) => {
    const an = a.member_name || ''
    const bn = b.member_name || ''
    return an.localeCompare(bn, 'ko') * dir
  })
  isNameAsc.value = !isNameAsc.value
  currentPage.value = 1
}
const getGatherDaysLeft = (memberId) => {
  const d = latestGatherDateFor(memberId)
  if (!d) return null
  const target = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diffDays = Math.ceil((target - now) / (24 * 60 * 60 * 1000))
  return Math.max(diffDays, 0)
}
const normalize = (v) => String(v || '').toLowerCase()
const isManGender = (v) => {
  const n = normalize(v)
  return n === 'man' || n === 'm' || n.startsWith('남')
}
const isWomanGender = (v) => {
  const n = normalize(v)
  return n === 'woman' || n === 'w' || n.startsWith('여')
}
const displayGender = (v) => {
  if (isWomanGender(v)) return '여'
  if (isManGender(v)) return '남'
  return String(v || '')
}
const displayedMembers = computed(() => {
  let list = members.value
  const q = searchName.value.trim().toLowerCase()
  if (q) {
    list = list.filter(m => (m.member_name || '').toLowerCase().includes(q))
  }
  if (selectedGender.value === 'man') {
    list = list.filter(m => isManGender(m.gender))
  } else if (selectedGender.value === 'woman') {
    list = list.filter(m => isWomanGender(m.gender))
  }
  const val = selectedPeriod.value
  if (val === 'total') return list
  const limit = Number(val)
  return list.filter(m => {
    const days = getGatherDaysLeft(m._id)
    if (days === null) return false
    if (limit === 15) return days <= 15 && days >= 8
    return days <= limit
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(displayedMembers.value.length / pageSize)))
const pages = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))
const sortedMembers = computed(() => {
  if (isAttendSorted.value || isLeaderSorted.value) {
    return displayedMembers.value
  }
  const dir = isNameAsc.value ? 1 : -1
  return [...displayedMembers.value].sort((a, b) => {
    const an = a.member_name || ''
    const bn = b.member_name || ''
    return an.localeCompare(bn, 'ko') * dir
  })
})
const pagedMembers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedMembers.value.slice(start, start + pageSize)
})
const sortByAttend = () => {
  if (!isAttendSorted.value) {
    members.value = [...members.value].sort((a, b) => {
      const ac = getTotalParticipation(a._id)
      const bc = getTotalParticipation(b._id)
      if (bc !== ac) return bc - ac
      const an = a.member_name || ''
      const bn = b.member_name || ''
      return an.localeCompare(bn, 'ko')
    })
  } else {
    members.value = [...originMembers.value]
  }

  isAttendSorted.value = !isAttendSorted.value
  isLeaderSorted.value = false
  currentPage.value = 1
}

const isBirthFiltered = ref(false)

const toggleBirthFilter = () => {
  if (!isBirthFiltered.value) {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    members.value = originMembers.value.filter(member => birthMonthOf(member.birth) === currentMonth)
  } else {
    members.value = [...originMembers.value]
  }

  isBirthFiltered.value = !isBirthFiltered.value
  currentPage.value = 1
}

const isLeaderSorted = ref(false)
const sortByLeader = () => {
  if (!isLeaderSorted.value) {
    const mon = new Date().getMonth() + 1
    const base = [...originMembers.value].filter(m => getLeaderMonthValue(m, mon) > 0)
    members.value = base.sort((a, b) => {
      const ac = getLeaderMonthValue(a, mon)
      const bc = getLeaderMonthValue(b, mon)
      if (bc !== ac) return bc - ac
      const an = a.member_name || ''
      const bn = b.member_name || ''
      return an.localeCompare(bn, 'ko')
    })
  } else {
    members.value = [...originMembers.value]
  }
  isLeaderSorted.value = !isLeaderSorted.value
  isAttendSorted.value = false
  currentPage.value = 1
}
const filterByBirthYear = () => {
  // 👉 전체 선택
  if (selectedBirthYear.value === 'total') {
    members.value = [...originMembers.value]
    return
  }

  // 👉 연도 필터
  members.value = originMembers.value.filter(member => {
    if (!member.birth) return false

    // YYMMDD / YYYYMMDD 둘 다 대응
    const birthYear =
      member.birth.length === 6
        ? member.birth.substring(0, 2)
        : member.birth.substring(2, 4)

    return birthYear === selectedBirthYear.value
  })
}

const goPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}
const prevPage = () => goPage(currentPage.value - 1)
const nextPage = () => goPage(currentPage.value + 1)

watch([displayedMembers], () => {
  currentPage.value = 1
})

onMounted(load)
</script>
