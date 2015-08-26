/*
 *  Document   : MortgageCalculator.js
 *  Author     : Leo Reading
 *  Date       : 2015-03-18
 *  Description: Provides an "all-inclusive" mortgage calculator based
 *    on a specific loan type, which breaks down all estimated costs,
 *    including additional fees, such as PMI and loan fees
 *
 */

var MortgageCalculator = function () {

    // DOM objects to manipulate
    var LoanTypeButtonClass = ".LoanTypeButton";
    var LoanTypeTitleClass = ".LoanTypeTitle";
    var LoanTypeDescriptionClass = ".LoanTypeDescription";
    var LoanShortNameClass = ".LoanShortName";

    var DescriptionContainerClass = ".DescriptionContainer";

    var Info_LoanFeeClass = ".Info-LoanFeeCell";
    var Info_StandardPMIClass = ".Info-StandardPMI";
    var Info_MinimumDownPaymentClass = ".Info-MinimumDownPayment";

    var Monthly_PrincipalAndInterest = ".Monthly-PrincipalAndInterest";
    var Monthly_PMI = ".Monthly-PMI";
    var Monthly_Insurance = ".Monthly-Insurance";
    var Monthly_TotalMonthlyPayment = ".Monthly-TotalMonthlyPayment";
    var Monthly_Taxes = ".Monthly-Taxes";

    var Total_TotalAmountBorrowed = ".Total-TotalAmountBorrowed";
    var Total_DownPayment = ".Total-DownPayment";
    var Total_OriginationFees = ".Total-OriginationFees";

    // Inputs (User changable)
    var LoanAmountID = "#LoanAmount";
    var DownPaymentID = "#DownPayment";
    var InterestRateInputID = "#InterestRateInput";
    var TermInputID = "#LoanTerm";
    var TaxesInputID = "#TaxesPerYear";
    var InsuranceInputID = "#InsuranceRate";

    // Other Variables
    var SelectedLoanTypeInteger = parseInt(0);
    var LoanAmount = parseInt(200000);
    var DownPaymentPercent = parseFloat(0);
    var InterestRate = parseFloat(.035);
    var TermInYears = parseInt(30);
    var Taxes = parseInt(0);
    var InsuranceRateAsDecimal = parseFloat(.035);




    function CalculateAllValues() {
        ValidateInputs();

        var DownPaymentTotal = LoanAmount * DownPaymentPercent;
        var TotalFees = LoanTypes.Properties[SelectedLoanTypeInteger].LoanFee * (LoanAmount - DownPaymentTotal);
        var TotalBorrowed = (LoanAmount - DownPaymentTotal) + TotalFees;
        var PandI = PrincipalAndInterest(TotalBorrowed, InterestRate, TermInYears);
        var PMI = CalculateMonthlyPMIValue(TotalBorrowed);
        var InsurancePerYear = InsuranceRateAsDecimal * LoanAmount;

        var TotalMonthlyPayment = CalculateTotalMonthlyPayment(PandI, PMI, (Taxes / 12), (InsurancePerYear / 12));

        $(Total_TotalAmountBorrowed).text("$" + TotalBorrowed.toFixed(2));
        $(Monthly_PrincipalAndInterest).text("$" + PandI.toFixed(2));
        $(Total_DownPayment).text("$" + DownPaymentTotal.toFixed(2));
        $(Total_OriginationFees).text("$" + TotalFees.toFixed(2));
        $(Monthly_PMI).text("$" + PMI.toFixed(2));
        $(Monthly_Insurance).text("$" + (InsurancePerYear / 12).toFixed(2));
        $(Monthly_Taxes).text("$" + (Taxes / 12).toFixed(2));
        $(Monthly_TotalMonthlyPayment).text("$" + TotalMonthlyPayment.toFixed(2));
    }; // end calculate all values

    function CalculateTotalMonthlyPayment(PandI, PMI, Taxes, HomeInsurance) {
        return PandI + PMI + Taxes + HomeInsurance;
    } // end calulate total monthly payment

    function CalculateMonthlyPMIValue(CalculatedLoanAmount) {
        // PMI is defined as follows:
        //      MonthlyPMI = (PMIRate * LoanAmount) / 12

        return LoanTypes.Properties[SelectedLoanTypeInteger].StandardPMI * CalculatedLoanAmount / 12;
    }; // end calculate pmi

    function ValidateInputs() {
        // Loan Amount
        if (isNaN(parseInt($(LoanAmountID).val()))) {
            $(LoanAmountID).val(LoanAmount);
        } else {
            LoanAmount = parseInt($(LoanAmountID).val());
        } // end if/else for loan amount


        // Down Payment
        if (isNaN(parseFloat($(DownPaymentID).val()))) {
            DownPaymentPercent = LoanTypes.Properties[SelectedLoanTypeInteger].FixedInterestRateEstimate;
            $(DownPaymentID).val(((LoanTypes.Properties[SelectedLoanTypeInteger].FixedInterestRateEstimate) * 100).toFixed(2));
        } else {
            DownPaymentPercent = parseFloat($(DownPaymentID).val() / 100);
        } // end if/else for down payment


        // Interest rate
        if (isNaN(parseFloat($(InterestRateInputID).val()))) {
            InterestRate = LoanTypes.Properties[SelectedLoanTypeInteger].FixedInterestRateEstimate;
            $(InterestRateInputID).val(((LoanTypes.Properties[SelectedLoanTypeInteger].FixedInterestRateEstimate) * 100).toFixed(2));
        } else {
            InterestRate = parseFloat($(InterestRateInputID).val() / 100);
        } // end if/else for interest rate


        // Term
        if (isNaN((parseInt($(TermInputID).val())))) {
            TermInYears = 30;
            $(TermInputID).val(30);
        } else {
            TermInYears = parseInt($(TermInputID).val());
        } // end if/else for term


        // Taxes
        if (isNaN(parseInt($(TaxesInputID).val()))) {
            Taxes = parseInt(0);
            $(TaxesInputID).val(parseInt(0));
        } else {
            Taxes = parseInt($(TaxesInputID).val());
        } // end if/else for taxes


        // Insurance
        if (isNaN(parseFloat($(InsuranceInputID).val()))) {
            InsuranceRateAsDecimal = parseFloat(.005);
            $(InsuranceInputID).val((InsuranceRateAsDecimal * 100).toFixed(2));
        } else {
            InsuranceRateAsDecimal = (parseFloat($(InsuranceInputID).val()) / 100);
        } // end if/else for insurance
    }; // end validate inputs

    // Calculates the monthly principal and interest paid.
    // This is the most that many mortgage calculators will give you
    function PrincipalAndInterest(LoanAmount, InterestAsDecimal, TermInYears) {
        // For a fixed rate, the calculation is as follows:
        //      M - P(i(1+i)^n) / ((1+i)^n - 1)
        //
        // WHERE:
        //          M = Monthly mortgage payment
        //          P = the principal, or intial amount borrowed
        //          i = Monthly interest rate
        //          n = Number of payments total

        // The above equation is broken up into two larger parenthesis.  We
        // will attack these as p1 and p2
        var n = TermInYears * 12;
        var i = InterestAsDecimal / 12;

        var p1 = LoanAmount * (i * Math.pow((1 + i), n));
        var p2 = Math.pow((1 + i), n) - 1;

        return p1 / p2;
    }; // end Principal And Interest


    // Create our Loan Type objects.  This object is written less elegantly than
    // it could be to preserve the option to serialize and send as a json object.
    // for more info, see: https://stijndewitt.wordpress.com/2014/01/26/enums-in-javascript/
    var LoanTypes = {
        USDA: 0,
        FHA: 1,
        TRADITIONAL: 2,
        Properties: {
            0: {
                Name: "USDA Rural Housing Development Loan",
                ShortName: "USDA",
                LoanFee: parseFloat(.02),
                StandardPMI: parseFloat(.005),
                MinimumDownPayment: parseFloat(0.0),
                FixedInterestRateEstimate: parseFloat(.035),
                Description: "USDA Rural Housing Development Loans are granted to home purchasers who meet specific income requirements who plan to purchase homes in areas specified by the USDA.  Most other FHA Loan requirements apply as well.  There is a 2% fee that is built into the total loan amount ($100,000 loan will actually be $102,000), and a 0.5% mortgage guarantee monthly fee, which is ultimately the USDA's version of PMI.  There is no minimum down payment for USDA loans, howevver you should still have money set aside for closing costs and other expenses."
            }, // end 0 properties
            1: {
                Name: "FHA Guaranteed Loan",
                ShortName: "FHA",
                LoanFee: parseFloat(.008),
                StandardPMI: parseFloat(.015),
                MinimumDownPayment: parseFloat(.035),
                FixedInterestRateEstimate: parseFloat(.035),
                Description: "FHA Loans are granted through the HUD program, and are a great option for first-time home buyers, and those who do not have the means of coming up with the traditional 20% down payment required for most mortgages.  FHA requires a minimum down-payment of 3.5% and roughly a 0.8% fee.  You must intend to live in the home as a primary residence, and also meet certain other criteria."
            }, // end 1 properties
            2: {
                Name: "Traditional Loan",
                ShortName: "TRADITIONAL",
                LoanFee: parseFloat(.02),
                StandardPMI: parseFloat(.02),
                MinimumDownPayment: parseFloat(.2),
                FixedInterestRateEstimate: parseFloat(.04),
                Description: "Traditional loans typically require up to 20% down, and also will have PMI issued against the loan.  In some cases there is no PMI if putting down more than 20% of the loan.  These are traaitionally more difficult to secure if you have less than perfect credit."
            } // end 2 properties
        } // end properties
    }; // end LoanTypes object

    function UpdateUI() {
        UpdateDescriptionContainer();
        UpdateLoanInfoTable();
        UpdateInputs();
    }; // end update ui

    function UpdateInputs() {
        $(InterestRateInputID).val((LoanTypes.Properties[SelectedLoanTypeInteger].FixedInterestRateEstimate * 100).toFixed(2));
        $(DownPaymentID).val((LoanTypes.Properties[SelectedLoanTypeInteger].MinimumDownPayment * 100).toFixed(2));
    }; // end update inputs

    function UpdateLoanInfoTable() {
        $(Info_LoanFeeClass).text((LoanTypes.Properties[SelectedLoanTypeInteger].LoanFee * 100).toFixed(2) + "%");
        $(Info_StandardPMIClass).text((LoanTypes.Properties[SelectedLoanTypeInteger].StandardPMI * 100).toFixed(2) + "%");
        $(Info_MinimumDownPaymentClass).text((LoanTypes.Properties[SelectedLoanTypeInteger].MinimumDownPayment * 100).toFixed(2) + "%");
        $(LoanShortNameClass).text(LoanTypes.Properties[SelectedLoanTypeInteger].ShortName);
    } // end update loan info table

    // Updates the description container styles and text based on the currently selected loan type
    function UpdateDescriptionContainer() {

        if ($(DescriptionContainerClass).hasClass("alert-danger")) {
            $(DescriptionContainerClass).removeClass("alert-danger");
            $(DescriptionContainerClass).addClass("alert-accept");
        } // end if

        $(LoanTypeTitleClass).text(LoanTypes.Properties[SelectedLoanTypeInteger].Name);
        $(LoanTypeDescriptionClass).text(LoanTypes.Properties[SelectedLoanTypeInteger].Description);
    }; // end update description container

    function UI_Init() {
        $(LoanTypeButtonClass).click(function () {
            SelectedLoanTypeInteger = parseInt($(this).data("loantypeid"));
            $(LoanTypeButtonClass).removeClass("btn-primary").removeClass("btn-default").addClass("btn-default");
            $(this).removeClass("btn-default").addClass("btn-primary");
            UpdateUI();
            CalculateAllValues();
        });

        $("input").change(function () { CalculateAllValues() });
    } // end ui init


    return {
        Init: function () {
            UI_Init();
        }, // end init
    }; // end return
}();
