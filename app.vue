<template>
  <v-app>
    <v-container>
      <div class="my-5">
        <h1 class="text-h3">BTC PRICE</h1>
        <client-only>
          <v-tabs class="my-5" v-model="currentTab">
            <v-tab>DAY</v-tab>
            <v-tab>WEEK</v-tab>
            <v-tab>MONTH</v-tab>
            <v-tab>CUSTOM</v-tab>
          </v-tabs>
          <VueDatePicker
            class="mb-4"
            v-if="currentTab === 3"
            v-model="customDate"
            :enable-time-picker="false"
            range
            partial-range
            auto-apply
          ></VueDatePicker>
        </client-only>
        <div>
          <Line :key="aa" :data="chartData" :options="chartOptions" />
        </div>
      </div>
    </v-container>
  </v-app>
</template>

<script setup>
import io from "socket.io-client";
import moment from "moment";

import API from "./api";

import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "vue-chartjs";
//import * as chartConfig from "./chartConfig.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const prices = ref([]);
const currentTab = ref(0);
const customDate = ref();

const chartData = ref({
  labels: [],
  datasets: [],
});

const chartOptions = ref({
  responsive: true,
  animation: {
    duration: 0,
  },
  hover: {
    animationDuration: 0,
  },
  responsiveAnimationDuration: 0,
  plugins: {
    legend: false,
  },
});

const dateStart = ref();
const dateEnd = ref();

const formatDate = (d) => d.utc().format("YYYY-MM-DD");

const aa = ref(0);
const fetchPrices = (start, end) => {
  if (start) start = formatDate(start);
  if (end) end = formatDate(end);

  API.fetchPrices(start, end).then((res) => {
    prices.value = res;
    aa.value++;
  });
};

const socket = io(API.API_URL);
socket.on("priceUpdated", () => {
  if (dateStart.value && dateEnd.value) {
    fetchPrices(dateStart.value, dateEnd.value);
  }
});

watch(prices, () => {
  const offset = moment().utcOffset() / 60;

  const labels = prices.value
    .map((p) => moment(p.date).add(offset, "hours"))
    .map((date) => {
      if (dateStart.value.isSame(dateEnd.value)) {
        return date.format("HH:mm");
      } else {
        return date.format("MM/DD");
      }
    });

  chartData.value.labels = [...new Set(labels)];

  chartData.value.datasets[0] = {
    backgroundColor: "rgba(255, 99, 132, 0.5)",
    data: prices.value.map((p) => p.rate),
  };
});

watch(currentTab, () => {
  const now = moment();
  switch (currentTab.value) {
    case 0:
      dateStart.value = now;
      dateEnd.value = now;
      break;
    case 1:
      dateStart.value = now.clone().startOf("week").add(1, "day");
      dateEnd.value = now.clone().endOf("week").add(1, "day");
      break;
    case 2:
      dateStart.value = now.clone().startOf("month");
      dateEnd.value = now.clone().endOf("month");
      break;
    case 3:
      customDate.value = null;
  }
});

watch(customDate, () => {
  if (!customDate.value) return;
  dateStart.value = moment(customDate.value[0]);
  dateEnd.value = moment(customDate.value[1]);
});

watchEffect(() => {
  if (dateStart.value && dateEnd.value) {
    fetchPrices(dateStart.value, dateEnd.value);
  }
});

onMounted(() => {
  dateStart.value = moment();
  dateEnd.value = moment();
});
</script>
