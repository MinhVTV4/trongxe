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
                const dateTimeA = new Date(`${a.date}T${a.time || '00:00:00'}`);
                const dateTimeB = new Date(`${b.date}T${b.time || '00:00:00'}`);
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
        detailSeatInfo.innerHTML = `<strong>Chỗ ngồi:</strong> <span style="color: red; font-weight: bold;">${bookedSeats}</span> / ${trip.vehicleSeats} (Còn trống: <span style="color: green; font-weight: bold;">${availableSeats}</span>)`;

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
                <h3>${trip.origin} → ${trip.destination}</h3>
                <p><strong>Ngày:</strong> ${formatDate(trip.date)} lúc ${trip.time}</p>
                <p><strong>Xe:</strong> ${trip.vehicleSeats} chỗ - <strong>Giá:</strong> ${formatCurrency(trip.pricePerSeat)}/chỗ</p>
                <p><strong>Chỗ:</strong> <span style="color: red; font-weight: bold;">${bookedSeats}</span> / ${trip.vehicleSeats}
                   (Còn: <span style="color: ${seatStatusColor}; font-weight: bold;">${availableSeats}</span>)
                </p>
                ${trip.notes ? `<p><i>Ghi chú: ${trip.notes}</i></p>` : ''}
                <div class="trip-actions">
                    <button class="action-button manage-btn" data-trip-id="${trip.id}">Xem & Quản lý Khách</button>
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

        // Sắp xếp lại hành khách theo trạng thái (booked -> picked_up -> còn lại) để dễ theo dõi
        passengers.sort((a, b) => {
            const statusOrder = { 'booked': 1, 'picked_up': 2, 'dropped_off': 3, 'no_show': 4, 'cancelled': 5 };
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });


        passengers.forEach((passenger, index) => {
            const passengerElement = document.createElement('div');
            passengerElement.classList.add('passenger-item');

            // Tạo link Google Maps (cần encode địa chỉ)
            const mapBaseUrl = "https://www.google.com/maps/search/"; // Sử dụng URL search của Google Maps
            const mapLinkPickup = `${mapBaseUrl}?api=1&query=${encodeURIComponent(passenger.pickupAddress)}`;
            const mapLinkDropoff = `${mapBaseUrl}?api=1&query=${encodeURIComponent(passenger.dropoffAddress)}`;


            // Lấy text và class cho trạng thái
            const { statusText, statusClass } = getStatusInfo(passenger.status);

            // Sử dụng name + contact làm định danh để xóa/cập nhật
            const passengerIdentifier = `data-passenger-name="${passenger.name}" data-passenger-contact="${passenger.contact}"`;

            passengerElement.innerHTML = `
                <div class="passenger-header">
                    <h4>${index + 1}. ${passenger.name} <span style="font-weight:normal; color:#555;">(${passenger.seatsBooked} chỗ)</span></h4>
                     <button class="delete-passenger-btn" title="Xóa khách này" data-trip-id="${tripId}" ${passengerIdentifier}>Xóa</button>
                </div>

                <div class="passenger-details">
                    <p><strong>SĐT:</strong> <a href="tel:${passenger.contact}" title="Gọi ${passenger.name}"><span class="icon icon-phone">☎</span> ${passenger.contact}</a></p>
                    <p><strong>Đón:</strong> <span class="address-pickup">${passenger.pickupAddress}</span> <a href="${mapLinkPickup}" target="_blank" title="Xem bản đồ điểm đón"><span class="icon icon-map">📍</span></a></p>
                    <p><strong>Trả:</strong> <span class="address-dropoff">${passenger.dropoffAddress}</span> <a href="${mapLinkDropoff}" target="_blank" title="Xem bản đồ điểm trả"><span class="icon icon-map">📍</span></a></p>
                    <p><strong>Trạng thái:</strong> <span class="passenger-status ${statusClass}">${statusText}</span></p>
                </div>

                ${passenger.notes ? `<div class="passenger-notes"><strong>Ghi chú:</strong> ${passenger.notes}</div>` : ''}

                <div class="passenger-actions">
                    ${passenger.status === 'booked' ? `<button class="status-update-btn btn-pickup" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="picked_up">Đã Đón</button>` : ''}
                    ${passenger.status === 'picked_up' ? `<button class="status-update-btn btn-dropoff" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="dropped_off">Đã Trả</button>` : ''}
                    ${passenger.status !== 'dropped_off' && passenger.status !== 'cancelled' ? `<button class="status-update-btn btn-cancel" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="cancelled">Hủy chỗ</button>` : ''}
                    ${passenger.status === 'booked' || passenger.status === 'picked_up' ? `<button class="status-update-btn btn-noshow" data-trip-id="${tripId}" ${passengerIdentifier} data-new-status="no_show">Không đến</button>` : ''}
                 </div>
            `;
            passengerListDiv.appendChild(passengerElement);
        });
    } // --- Kết thúc hàm displayPassengerList ---

    // === Helper Functions ===
    function calculateBookedSeats(trip) {
         // Chỉ tính các chỗ của khách chưa bị hủy hoặc không đến
        return trip.passengers.reduce((sum, p) => (p.status !== 'cancelled' && p.status !== 'no_show') ? sum + p.seatsBooked : sum, 0);
    }

    function formatCurrency(amount) {
        if (isNaN(amount)) return "N/A";
        return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }

    function formatDate(dateString) {
         if (!dateString) return "N/A";
        try {
            const [year, month, day] = dateString.split('-');
            // Kiểm tra xem có phải là ngày hợp lệ không
            if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) {
                 throw new Error("Invalid date format (YYYY-MM-DD expected)");
            }
             const date = new Date(year, month - 1, day); // month is 0-indexed
             // Kiểm tra thêm tính hợp lệ của ngày tháng (ví dụ không có ngày 31/02)
             if (isNaN(date.getTime()) || date.getFullYear() !== parseInt(year) || date.getMonth() !== parseInt(month) - 1 || date.getDate() !== parseInt(day)) {
                 throw new Error("Invalid date value");
             }
            return `${day}/${month}/${year}`;
        } catch (e) {
            console.error("Lỗi định dạng ngày:", dateString, e);
            return dateString; // Trả về chuỗi gốc nếu lỗi
        }
    } // <<<--- DẤU } BỊ THIẾU Ở ĐÂY TRONG PHIÊN BẢN TRƯỚC

    // Hàm lấy text và class CSS cho trạng thái
    function getStatusInfo(status) {
        switch (status) {
            case 'booked': return { statusText: 'Đã đặt', statusClass: 'status-booked' };
            case 'picked_up': return { statusText: 'Đã đón', statusClass: 'status-picked_up' };
            case 'dropped_off': return { statusText: 'Đã trả', statusClass: 'status-dropped_off' };
            case 'cancelled': return { statusText: 'Đã hủy', statusClass: 'status-cancelled' };
            case 'no_show': return { statusText: 'Không đến', statusClass: 'status-no_show' };
            default: return { statusText: status || 'N/A', statusClass: '' };
        }
    }

    // === Event Listeners ===

    // 1. Thêm chuyến đi mới
    addTripForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newTrip = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 8), // ID phức tạp hơn chút
            origin: document.getElementById('trip-origin').value.trim(),
            destination: document.getElementById('trip-destination').value.trim(),
            date: document.getElementById('trip-date').value,
            time: document.getElementById('trip-time').value,
            vehicleSeats: parseInt(document.getElementById('vehicle-seats').value),
            pricePerSeat: parseInt(document.getElementById('price-per-seat').value),
            notes: document.getElementById('trip-notes').value.trim(),
            passengers: []
        };

        // Kiểm tra ngày hợp lệ trước khi thêm
        if (!newTrip.date || formatDate(newTrip.date) === newTrip.date) { // Nếu formatDate trả về chuỗi gốc tức là có lỗi
             alert('Ngày đi không hợp lệ. Vui lòng chọn lại.');
             return;
        }

        if (!newTrip.origin || !newTrip.destination || !newTrip.time || isNaN(newTrip.vehicleSeats) || newTrip.vehicleSeats <= 0 || isNaN(newTrip.pricePerSeat)) {
            alert('Vui lòng nhập đầy đủ thông tin hợp lệ cho chuyến đi.');
            return;
        }


        const trips = getTrips();
        trips.push(newTrip);
        saveTrips(trips);

        addTripForm.reset();
        displayTrips();
    });

    // 2. Xử lý click trên danh sách chuyến đi (Quản lý khách / Xóa chuyến)
    tripListDiv.addEventListener('click', (event) => {
        const target = event.target.closest('button'); // Tìm button gần nhất được click
        if (!target) return; // Bỏ qua nếu không phải click vào button

        const tripId = target.dataset.tripId;
        if (!tripId) return;

        if (target.classList.contains('manage-btn')) {
            showTripDetailView(tripId);
        } else if (target.classList.contains('delete-btn')) {
            const trip = findTripById(tripId);
            const tripName = trip ? `${trip.origin} → ${trip.destination} (${formatDate(trip.date)})` : "chuyến đi này";
            if (confirm(`Bạn có chắc muốn xóa "${tripName}" và toàn bộ thông tin hành khách? Hành động này không thể hoàn tác.`)) {
                let trips = getTrips();
                trips = trips.filter(trip => trip.id !== tripId);
                saveTrips(trips);
                displayTrips();
            }
        }
    });

    // 3. Quay lại danh sách từ màn hình chi tiết
    backToListBtn.addEventListener('click', showTripListView);

    // 4. Thêm hành khách mới (trong màn hình chi tiết)
    addPassengerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const tripId = currentTripIdInput.value;
        if (!tripId) return;
        const trip = findTripById(tripId);
        if (!trip) { alert('Lỗi: Không tìm thấy chuyến đi.'); return; }

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
        const currentBookedSeats = calculateBookedSeats(trip);
        if (currentBookedSeats + seatsBooked > trip.vehicleSeats) {
             alert(`Không đủ chỗ! Chỉ còn ${trip.vehicleSeats - currentBookedSeats} chỗ trống.`);
             return;
         }

        const newPassenger = {
            // id: Date.now().toString() + Math.random(), // Có thể thêm ID riêng cho khách nếu cần
            name: passengerName,
            contact: passengerContact, // Dùng name + contact làm định danh tạm thời
            seatsBooked: seatsBooked,
            pickupAddress: pickupAddress,
            dropoffAddress: dropoffAddress,
            notes: passengerNotes,
            status: 'booked' // Trạng thái mặc định
        };

        // Cập nhật chuyến đi và lưu
        let trips = getTrips();
        const tripIndex = trips.findIndex(t => t.id === tripId);
        if (tripIndex > -1) {
             // Kiểm tra xem khách đã tồn tại chưa (dựa trên tên và sđt và chưa bị hủy) để tránh trùng lặp
             const existingPassenger = trips[tripIndex].passengers.find(p => p.name === newPassenger.name && p.contact === newPassenger.contact && p.status !== 'cancelled');
             if (existingPassenger) {
                 if (!confirm(`Khách hàng "${newPassenger.name}" (${newPassenger.contact}) đã tồn tại trong chuyến này và chưa bị hủy. Bạn vẫn muốn thêm lượt đặt mới?`)){
                     addPassengerForm.reset(); // Reset form nếu không thêm
                     return; // Hủy nếu không muốn thêm trùng
                 }
             }

            trips[tripIndex].passengers.push(newPassenger);
            saveTrips(trips);
            showTripDetailView(tripId);
            addPassengerForm.reset();
        } else {
             alert('Lỗi: Không tìm thấy chuyến đi để cập nhật.');
        }
    });

     // 5. Xử lý các nút trong danh sách khách hàng (Xóa khách, Cập nhật trạng thái)
     passengerListDiv.addEventListener('click', (event) => {
         const target = event.target.closest('button'); // Tìm button gần nhất
         if (!target) return;

         const tripId = target.dataset.tripId;
         // Sử dụng name và contact để tìm khách hàng thay vì index vì list đã được sắp xếp lại
         const passengerName = target.dataset.passengerName;
         const passengerContact = target.dataset.passengerContact;

         if (!tripId || !passengerName || passengerContact === undefined) return; // Cần đủ thông tin để xác định (contact có thể rỗng nhưng phải tồn tại)

         let trips = getTrips();
         const tripIndex = trips.findIndex(t => t.id === tripId);

         if (tripIndex === -1) {
             console.error("Lỗi: Không tìm thấy chuyến đi.");
             return;
         }
         // Tìm index của khách hàng trong mảng gốc dựa trên name và contact
         // Cần tìm *chính xác* khách hàng đó, vì có thể có nhiều khách trùng tên/sđt nhưng ở trạng thái khác nhau
         // Cách tốt nhất là tìm index của phần tử DOM mà nút đó thuộc về, nhưng làm vậy hơi phức tạp
         // Tạm thời vẫn dùng name+contact, nhưng cần lưu ý nếu có khách trùng tên+sđt thì có thể nhầm lẫn
         // -> Giải pháp tốt hơn là gán ID duy nhất cho mỗi passenger khi tạo.
         const passengerIndex = trips[tripIndex].passengers.findIndex(p => p.name === passengerName && p.contact === passengerContact);

         if (passengerIndex === -1) {
             console.warn("Cảnh báo: Không tìm thấy hành khách với tên và SĐT này để thực hiện hành động. Có thể khách đã bị xóa hoặc thông tin không khớp.");
             // Cập nhật lại giao diện để đảm bảo đồng bộ
             showTripDetailView(tripId);
             return;
         }

         // 5a. Xử lý nút Xóa Khách
         if (target.classList.contains('delete-passenger-btn')) {
             if (confirm(`Bạn có chắc muốn xóa hành khách "${passengerName}" (${passengerContact})?`)) {
                 trips[tripIndex].passengers.splice(passengerIndex, 1); // Xóa khách khỏi mảng gốc
                 saveTrips(trips);
                 showTripDetailView(tripId); // Cập nhật hiển thị
             }
         }
         // 5b. Xử lý nút Cập nhật Trạng thái
         else if (target.classList.contains('status-update-btn')) {
             const newStatus = target.dataset.newStatus;
             if (newStatus) {
                  // Chỉ cập nhật nếu trạng thái mới hợp lệ
                 const validStatuses = ['booked', 'picked_up', 'dropped_off', 'cancelled', 'no_show'];
                 if (validStatuses.includes(newStatus)) {
                     trips[tripIndex].passengers[passengerIndex].status = newStatus;
                     saveTrips(trips);
                     showTripDetailView(tripId); // Cập nhật hiển thị
                 } else {
                     console.warn("Trạng thái mới không hợp lệ:", newStatus);
                 }
             }
         }
     }); // --- Kết thúc passengerListDiv click listener ---

    // === Initial Load ===
    showTripListView(); // Hiển thị view chính khi tải trang

}); // End DOMContentLoaded
