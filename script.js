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

    const STORAGE_KEY = 'xeGhepTrips_v2'; // Đổi key nếu cấu trúc dữ liệu thay đổi

    // === Data Handling ===
    function getTrips() {
        const tripsJson = localStorage.getItem(STORAGE_KEY);
        try {
            // Sắp xếp theo ngày giờ gần nhất trước khi trả về
            const trips = tripsJson ? JSON.parse(tripsJson) : [];
            trips.sort((a, b) => {
                const dateTimeA = new Date(`${a.date}T${a.time}`);
                const dateTimeB = new Date(`${b.date}T${b.time}`);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
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
        if (trip.notes) {
             detailTripNotes.textContent = `Ghi chú chuyến đi: ${trip.notes}`;
             detailTripNotes.classList.remove('hidden');
        } else {
            detailTripNotes.classList.add('hidden');
        }


        // Cập nhật thông tin chỗ ngồi
        const bookedSeats = calculateBookedSeats(trip);
        const availableSeats = trip.vehicleSeats - bookedSeats;
        detailSeatInfo.innerHTML = `<strong>Chỗ ngồi:</strong> <span style="color: red;">${bookedSeats}</span> / ${trip.vehicleSeats} (Còn trống: <span style="color: green;">${availableSeats}</span>)`;

        // Hiển thị danh sách hành khách
        displayPassengerList(trip.passengers, tripId);

        // Đặt tripId hiện tại cho form thêm khách
        currentTripIdInput.value = tripId;
        addPassengerForm.reset(); // Xóa form thêm khách cũ

        // Chuyển view
        tripListView.classList.add('hidden');
        tripDetailView.classList.remove('hidden');
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
            const seatStatusColor = availableSeats <= 0 ? 'red' : 'green';

            tripElement.innerHTML = `
                <h3>${trip.origin} &rarr; ${trip.destination}</h3>
                <p><strong>Ngày:</strong> ${formatDate(trip.date)} lúc ${trip.time}</p>
                <p><strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> ${formatCurrency(trip.pricePerSeat)}/chỗ</p>
                <p><strong>Chỗ:</strong> <span style="color: red;">${bookedSeats}</span> / ${trip.vehicleSeats}
                   (Còn: <span style="color: ${seatStatusColor};">${availableSeats}</span>)
                </p>
                ${trip.notes ? `<p><i>Ghi chú: ${trip.notes}</i></p>` : ''}
                <div class="trip-actions">
                    <button class="action-button manage-btn" data-trip-id="${trip.id}">Quản lý Khách</button>
                    <button class="action-button delete-btn" data-trip-id="${trip.id}">Xóa Chuyến</button>
                </div>
            `;
            tripListDiv.appendChild(tripElement);
        });
    }

    function displayPassengerList(passengers, tripId) {
        passengerListDiv.innerHTML = ''; // Xóa danh sách cũ
        if (!passengers || passengers.length === 0) {
            passengerListDiv.innerHTML = '<p>Chưa có hành khách nào cho chuyến này.</p>';
            return;
        }

        passengers.forEach((passenger, index) => {
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item');
            // Lưu cả tripId và passengerIndex để xóa
            passengerElement.dataset.tripId = tripId;
            passengerElement.dataset.passengerIndex = index;

            passengerElement.innerHTML = `
                <div class="passenger-info">
                    <p><strong>${index + 1}. ${passenger.name}</strong> (${passenger.contact}) - ${passenger.seatsBooked} chỗ</p>
                    <p class="pickup-dropoff">Đón: ${passenger.pickupAddress}</p>
                    <p class="pickup-dropoff">Trả: ${passenger.dropoffAddress}</p>
                    ${passenger.notes ? `<p><i>Ghi chú khách: ${passenger.notes}</i></p>` : ''}
                </div>
                <button class="delete-passenger-btn" data-trip-id="${tripId}" data-passenger-index="${index}">Xóa Khách</button>
            `;
            passengerListDiv.appendChild(passengerElement);
        });
    }

    // === Helper Functions ===
    function calculateBookedSeats(trip) {
        return trip.passengers.reduce((sum, p) => sum + p.seatsBooked, 0);
    }

    function formatCurrency(amount) {
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    function formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // === Event Listeners ===

    // 1. Thêm chuyến đi mới
    addTripForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newTrip = {
            id: Date.now().toString(), // ID duy nhất đơn giản
            origin: document.getElementById('trip-origin').value.trim(),
            destination: document.getElementById('trip-destination').value.trim(),
            date: document.getElementById('trip-date').value,
            time: document.getElementById('trip-time').value,
            vehicleSeats: parseInt(document.getElementById('vehicle-seats').value),
            pricePerSeat: parseInt(document.getElementById('price-per-seat').value),
            notes: document.getElementById('trip-notes').value.trim(),
            passengers: [] // Mảng hành khách ban đầu rỗng
        };

        if (!newTrip.origin || !newTrip.destination || !newTrip.date || !newTrip.time || isNaN(newTrip.vehicleSeats) || newTrip.vehicleSeats <= 0 || isNaN(newTrip.pricePerSeat)) {
            alert('Vui lòng nhập đầy đủ thông tin hợp lệ cho chuyến đi.');
            return;
        }

        const trips = getTrips();
        trips.push(newTrip);
        saveTrips(trips);

        addTripForm.reset();
        displayTrips(); // Hiển thị lại danh sách chính
    });

    // 2. Xử lý click trên danh sách chuyến đi (Quản lý khách / Xóa chuyến)
    tripListDiv.addEventListener('click', (event) => {
        const target = event.target;
        const tripId = target.dataset.tripId;

        if (!tripId) return; // Bỏ qua nếu không phải click vào nút có data-trip-id

        if (target.classList.contains('manage-btn')) {
            showTripDetailView(tripId);
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`Bạn có chắc muốn xóa chuyến đi này và toàn bộ thông tin hành khách?`)) {
                let trips = getTrips();
                trips = trips.filter(trip => trip.id !== tripId);
                saveTrips(trips);
                displayTrips(); // Cập nhật lại danh sách chính
            }
        }
    });

    // 3. Quay lại danh sách từ màn hình chi tiết
    backToListBtn.addEventListener('click', showTripListView);

    // 4. Thêm hành khách mới (trong màn hình chi tiết)
    addPassengerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const tripId = currentTripIdInput.value; // Lấy ID chuyến đi đang xem
        if (!tripId) return;

        const trip = findTripById(tripId);
        if (!trip) {
            alert('Lỗi: Không tìm thấy chuyến đi để thêm khách.');
            return;
        }

        const passengerName = document.getElementById('passenger-name').value.trim();
        const passengerContact = document.getElementById('passenger-contact').value.trim();
        const seatsBooked = parseInt(document.getElementById('passenger-seats').value);
        const pickupAddress = document.getElementById('passenger-pickup').value.trim();
        const dropoffAddress = document.getElementById('passenger-dropoff').value.trim();
        const passengerNotes = document.getElementById('passenger-notes').value.trim();


        if (!passengerName || !passengerContact || isNaN(seatsBooked) || seatsBooked <= 0 || !pickupAddress || !dropoffAddress) {
            alert('Vui lòng nhập đầy đủ thông tin khách hàng (tên, SĐT, số chỗ, điểm đón, điểm trả).');
            return;
        }

        // Kiểm tra số chỗ còn lại
        const currentBookedSeats = calculateBookedSeats(trip);
        if (currentBookedSeats + seatsBooked > trip.vehicleSeats) {
            alert(`Không đủ chỗ! Chỉ còn ${trip.vehicleSeats - currentBookedSeats} chỗ trống.`);
            return;
        }

        const newPassenger = {
            // id: Date.now().toString() + Math.random(), // ID khách nếu cần
            name: passengerName,
            contact: passengerContact,
            seatsBooked: seatsBooked,
            pickupAddress: pickupAddress,
            dropoffAddress: dropoffAddress,
            notes: passengerNotes
            // Thêm trạng thái đón trả ở đây nếu muốn: status: 'Chưa đón'
        };

        // Cập nhật lại chuyến đi trong danh sách tổng
        let trips = getTrips();
        const tripIndex = trips.findIndex(t => t.id === tripId);
        if (tripIndex > -1) {
            trips[tripIndex].passengers.push(newPassenger);
            saveTrips(trips);
            // Hiển thị lại màn hình chi tiết để cập nhật danh sách khách và số chỗ
            showTripDetailView(tripId);
            addPassengerForm.reset(); // Reset form sau khi thêm thành công
        } else {
             alert('Lỗi: Không tìm thấy chuyến đi để cập nhật.');
        }
    });

     // 5. Xóa hành khách (trong màn hình chi tiết)
     passengerListDiv.addEventListener('click', (event) => {
         const target = event.target;
         if (target.classList.contains('delete-passenger-btn')) {
             const tripId = target.dataset.tripId;
             const passengerIndex = parseInt(target.dataset.passengerIndex);

             if (confirm(`Bạn có chắc muốn xóa hành khách "${target.closest('.passenger-item').querySelector('.passenger-info strong').textContent.split('. ')[1]}"?`)) {
                let trips = getTrips();
                const tripIndex = trips.findIndex(t => t.id === tripId);
                if (tripIndex > -1 && trips[tripIndex].passengers && trips[tripIndex].passengers[passengerIndex]) {
                    trips[tripIndex].passengers.splice(passengerIndex, 1); // Xóa khách khỏi mảng
                    saveTrips(trips);
                    // Hiển thị lại màn hình chi tiết để cập nhật
                    showTripDetailView(tripId);
                } else {
                    alert('Lỗi: Không tìm thấy hành khách hoặc chuyến đi để xóa.');
                }
             }
         }
     });

    // === Initial Load ===
    showTripListView(); // Hiển thị view chính khi tải trang

}); // End DOMContentLoaded
