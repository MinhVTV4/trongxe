document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const tripListView = document.getElementById('trip-list-view');
    const tripDetailView = document.getElementById('trip-detail-view');

    const addTripForm = document.getElementById('add-trip-form');
    const tripListDiv = document.getElementById('trip-list');

    const backToListBtn = document.getElementById('back-to-list-btn');
    const detailTripTitle = document.getElementById('detail-trip-title');
    const detailTripInfo = document.getElementById('detail-trip-info');
    const detailSeatInfo = document.getElementById('detail-seat-info');
    const detailTripNotes = document.getElementById('detail-trip-notes');
    const passengerListDiv = document.getElementById('passenger-list');
    const addPassengerForm = document.getElementById('add-passenger-form');
    const currentTripIdInput = document.getElementById('current-trip-id'); // Input ẩn lưu tripId

    const STORAGE_KEY = 'xeGhepTrips_v3'; // Sử dụng key mới cho phiên bản này

    // === Data Handling ===
    function getTrips() {
        const tripsJson = localStorage.getItem(STORAGE_KEY);
        try {
            const trips = tripsJson ? JSON.parse(tripsJson) : [];
            // Sắp xếp theo ngày giờ gần nhất trước khi trả về
            trips.sort((a, b) => {
                // Tạo đối tượng Date hợp lệ từ date và time
                const dateTimeA = new Date(`<span class="math-inline">\{a\.date\}T</span>{a.time || '00:00:00'}`);
                const dateTimeB = new Date(`<span class="math-inline">\{b\.date\}T</span>{b.time || '00:00:00'}`);
                // Xử lý trường hợp Date không hợp lệ (nếu có)
                if (isNaN(dateTimeA.getTime())) return 1;
                if (isNaN(dateTimeB.getTime())) return -1;
                return dateTimeA - dateTimeB;
            });
            return trips;
        } catch (e) {
            console.error("Lỗi parse JSON từ localStorage:", e);
            localStorage.removeItem(STORAGE_KEY); // Xóa dữ liệu lỗi nếu có
            return [];
        }
    }

    function saveTrips(trips) {
        try {
             localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
        } catch (e) {
            console.error("Lỗi khi lưu vào localStorage:", e);
            alert("Đã có lỗi xảy ra khi lưu dữ liệu. LocalStorage có thể đã đầy.");
        }
    }

    function findTripById(tripId) {
        const trips = getTrips();
        return trips.find(trip => trip.id === tripId);
    }

    // === View Switching ===
    function showTripListView() {
        tripDetailView.classList.add('hidden');
        tripListView.classList.remove('hidden');
        displayTrips(); // Luôn cập nhật danh sách khi quay lại
        window.scrollTo(0, 0); // Cuộn lên đầu trang
    }

    function showTripDetailView(tripId) {
        const trip = findTripById(tripId);
        if (!trip) {
            alert('Không tìm thấy chuyến đi!');
            showTripListView();
            return;
        }

        // Cập nhật thông tin chi tiết chuyến đi
        detailTripTitle.textContent = `Chi tiết: ${trip.origin} → ${trip.destination}`;
        detailTripInfo.innerHTML = `<strong>Ngày đi:</strong> ${formatDate(trip.date)} lúc ${trip.time}<br>
                                    <strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> ${formatCurrency(trip.pricePerSeat)}/chỗ`;

        // Hiển thị hoặc ẩn ghi chú chuyến đi
        if (trip.notes) {
             detailTripNotes.textContent = `Ghi chú chuyến đi: ${trip.notes}`;
             detailTripNotes.classList.remove('hidden');
        } else {
            detailTripNotes.classList.add('hidden');
        }


        // Cập nhật thông tin chỗ ngồi
        const bookedSeats = calculateBookedSeats(trip);
        const availableSeats = trip.vehicleSeats - bookedSeats;
        detailSeatInfo.innerHTML = `<strong>Chỗ ngồi:</strong> <span style="color: red; font-weight: bold;">${bookedSeats}</span> / <span class="math-inline">\{trip\.vehicleSeats\} \(Còn trống\: <span style\="color\: green; font\-weight\: bold;"\></span>{availableSeats}</span>)`;

        // Hiển thị danh sách hành khách
        displayPassengerList(trip.passengers, tripId);

        // Đặt tripId hiện tại cho form thêm khách và reset form
        currentTripIdInput.value = tripId;
        addPassengerForm.reset();

        // Chuyển view
        tripListView.classList.add('hidden');
        tripDetailView.classList.remove('hidden');
        window.scrollTo(0, 0); // Cuộn lên đầu trang
    }

    // === Rendering Functions ===
    function displayTrips() {
        const trips = getTrips();
        tripListDiv.innerHTML = ''; // Xóa danh sách cũ

        if (trips.length === 0) {
            tripListDiv.innerHTML = '<p>Chưa có chuyến đi nào được tạo.</p>';
            return;
        }

        trips.forEach(trip => {
            const tripElement = document.createElement('div');
            tripElement.classList.add('trip-item');
            tripElement.dataset.tripId = trip.id; // Lưu ID vào data attribute

            const bookedSeats = calculateBookedSeats(trip);
            const availableSeats = trip.vehicleSeats - bookedSeats;
            const seatStatusColor = availableSeats <= 0 ? 'red' : (availableSeats < trip.vehicleSeats ? '#e08100' : 'green'); // Đỏ: hết chỗ, Cam: còn ít, Xanh: còn nhiều

            tripElement.innerHTML = `
                <h3>${trip.origin} &rarr; ${trip.destination}</h3>
                <p><strong>Ngày:</strong> ${formatDate(trip.date)} lúc ${trip.time}</p>
                <p><strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> <span class="math-inline">\{formatCurrency\(trip\.pricePerSeat\)\}/chỗ</p\>
<p\><strong\>Chỗ\:</strong\> <span style\="color\: red; font\-weight\: bold;"\></span>{bookedSeats}</span> / ${trip.vehicleSeats}
                   (Còn: <span style="color: <span class="math-inline">\{seatStatusColor\}; font\-weight\: bold;"\></span>{availableSeats}</span>)
                </p>
                ${trip.notes ? `<p><i>Ghi chú: ${trip.notes}</i></p>` : ''}
                <div class="trip-actions">
                    <button class="action-button manage-btn" data-trip-id="<span class="math-inline">\{trip\.id\}"\>Xem & Quản lý Khách</button\>
<button class\="action\-button delete\-btn" data\-trip\-id\="</span>{trip.id}">Xóa Chuyến</button>
                </div>
            `;
            tripListDiv.appendChild(tripElement);
        });
    }

    // === CẬP NHẬT HÀM NÀY ===
    function displayPassengerList(passengers, tripId) {
        passengerListDiv.innerHTML = ''; // Xóa danh sách cũ
        if (!passengers || passengers.length === 0) {
            passengerListDiv.innerHTML = '<p>Chưa có hành khách nào cho chuyến này.</p>';
            return;
        }

        // Sắp xếp lại hành khách theo trạng thái (booked -> picked_up -> còn lại) để dễ theo dõi
        passengers.sort((a, b) => {
            const statusOrder = { 'booked': 1, 'picked_up': 2, 'dropped_off': 3, 'no_show': 4, 'cancelled': 5 };
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });


        passengers.forEach((passenger, index) => {
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item');
           
